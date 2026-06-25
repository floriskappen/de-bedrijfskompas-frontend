import { ByokStreamError } from "./types";
import type { ByokProviderAdapter, ByokProviderRequest, ByokStreamEvent, ByokUsage } from "./types";

const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";

function getNumeric(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function extractCostUsd(usage: Record<string, unknown> | undefined): number | undefined {
  if (!usage) return undefined;
  return getNumeric(usage.cost) ?? getNumeric(usage.total_cost) ?? getNumeric(usage.cost_usd);
}

function extractUsage(value: unknown): ByokUsage {
  const usage = value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
  const costUsd = extractCostUsd(usage);

  return {
    promptTokens: getNumeric(usage?.prompt_tokens),
    completionTokens: getNumeric(usage?.completion_tokens),
    totalTokens: getNumeric(usage?.total_tokens),
    costUsd,
    costSource: costUsd === undefined ? "unknown" : "provider",
  };
}

async function readErrorText(response: Response): Promise<string> {
  try {
    const body = await response.text();
    return body.toLowerCase();
  } catch {
    return "";
  }
}

async function mapOpenRouterHttpError(response: Response): Promise<ByokStreamError> {
  if (response.status === 401 || response.status === 403) return new ByokStreamError("invalid_key");
  if (response.status === 402) return new ByokStreamError("insufficient_credit");
  if (response.status === 429) return new ByokStreamError("rate_limited");

  const errorText = await readErrorText(response);
  if (errorText.includes("credit") || errorText.includes("balance")) {
    return new ByokStreamError("insufficient_credit");
  }
  if (errorText.includes("key") || errorText.includes("auth")) {
    return new ByokStreamError("invalid_key");
  }

  return new ByokStreamError("malformed_response");
}

// Parses an SSE byte stream into byok stream events. Lines are buffered so a
// `data:` payload split across chunk reads is reassembled before parsing. The
// provider sends one `data: {json}` line per event terminated by a blank line,
// then `data: [DONE]` to end. Provider usage (the real cost source) arrives in
// a usage-bearing chunk — typically the final one before `[DONE]`.
async function* parseOpenRouterStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<ByokStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let yieldedUsage = false;

  const processLine = function* (rawLine: string): Generator<ByokStreamEvent> {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line || line.startsWith(":")) return;
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    let payload: unknown;
    try {
      payload = JSON.parse(data);
    } catch {
      return;
    }
    const choices = (payload as { choices?: Array<{ delta?: { content?: unknown } }> })?.choices;
    const delta = choices?.[0]?.delta?.content;
    if (typeof delta === "string" && delta) yield { type: "text", delta };
    const usage = (payload as { usage?: unknown })?.usage;
    if (usage) {
      yieldedUsage = true;
      yield { type: "usage", usage: extractUsage(usage) };
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const rawLine = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        yield* processLine(rawLine);
      }
    }
    // Flush any trailing line the stream ended without a newline after.
    buffer += decoder.decode();
    if (buffer.trim()) yield* processLine(buffer);
  } finally {
    reader.releaseLock();
  }

  // Guarantee a terminal usage event: if the provider omitted usage, synthesize
  // an unknown-cost usage so the boundary always lands a spend record rather
  // than leaving a request pending forever.
  if (!yieldedUsage) {
    yield { type: "usage", usage: { costSource: "unknown" } };
  }
}

export const openRouterAdapter: ByokProviderAdapter = {
  id: "openrouter",
  async *send(request: ByokProviderRequest): AsyncGenerator<ByokStreamEvent> {
    const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: "POST",
      signal: request.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${request.apiKey}`,
        "X-OpenRouter-Title": "de bedrijfskompas",
      },
      body: JSON.stringify({
        model: request.modelId,
        messages: request.messages,
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens,
        response_format: request.responseFormat === "json" ? { type: "json_object" } : undefined,
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    if (!response.ok) throw await mapOpenRouterHttpError(response);
    if (!response.body) throw new ByokStreamError("malformed_response");

    yield* parseOpenRouterStream(response.body);
  },
};
