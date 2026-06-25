import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openRouterAdapter } from "./openrouter";
import { ByokStreamError } from "./types";
import type { ByokProviderRequest, ByokStreamEvent } from "./types";

function streamingResponse(chunks: string[], init?: ResponseInit): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
    ...init,
  });
}

function makeRequest(overrides: Partial<ByokProviderRequest> = {}): ByokProviderRequest {
  return {
    apiKey: "sk-test",
    providerId: "openrouter",
    modelId: "deepseek/deepseek-v4-flash",
    category: "worker",
    purpose: "test",
    messages: [{ role: "user", content: "hello" }],
    ...overrides,
  };
}

async function collectEvents(request: ByokProviderRequest): Promise<ByokStreamEvent[]> {
  const events: ByokStreamEvent[] = [];
  for await (const event of openRouterAdapter.send(request)) events.push(event);
  return events;
}

describe("openrouter streaming adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("openrouter streams text deltas then usage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamingResponse([
          'data: {"choices":[{"delta":{"content":"hel"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
          'data: {"choices":[],"usage":{"prompt_tokens":3,"completion_tokens":2,"total_tokens":5,"cost":0.0123}}\n\n',
          "data: [DONE]\n\n",
        ])
      )
    );

    const events = await collectEvents(makeRequest());

    const text = events.filter((e) => e.type === "text").map((e) => (e.type === "text" ? e.delta : "")).join("");
    const usage = events.find((e) => e.type === "usage");

    expect(text).toBe("hello");
    expect(usage).toMatchObject({
      type: "usage",
      usage: { promptTokens: 3, completionTokens: 2, totalTokens: 5, costUsd: 0.0123, costSource: "provider" },
    });
  });

  it("openrouter survives a chunk split mid-data line", async () => {
    const fullLine = 'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n';
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(streamingResponse([fullLine.slice(0, 10), fullLine.slice(10)]))
    );

    const events = await collectEvents(makeRequest());

    expect(events.some((e) => e.type === "text" && e.delta === "ok")).toBe(true);
  });

  it("openrouter maps 401 to invalid_key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("unauthorized", { status: 401 }))
    );

    await expect(collectEvents(makeRequest())).rejects.toMatchObject({ error: "invalid_key" });
    await expect(collectEvents(makeRequest())).rejects.toBeInstanceOf(ByokStreamError);
  });

  it("openrouter maps a stream without usage to unknown cost", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamingResponse([
          'data: {"choices":[{"delta":{"content":"answer"}}]}\n\n',
          "data: [DONE]\n\n",
        ])
      )
    );

    const events = await collectEvents(makeRequest());
    const usage = events.find((e) => e.type === "usage");

    expect(usage).toMatchObject({ type: "usage", usage: { costSource: "unknown" } });
    expect(usage && usage.type === "usage" && usage.usage.costUsd).toBeUndefined();
  });
});
