import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BYOK_STORAGE_KEY,
  clearByokSessionForTests,
  confirmByokSetup,
  confirmSavedByokKey,
  getSessionByokApiKey,
  readByokConfig,
  resetByokForTests,
  sendByokLlmRequest,
} from ".";

describe("bring your own key llm", () => {
  beforeEach(() => {
    const events = new EventTarget();
    const store = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    };
    const fakeWindow = {
      localStorage,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events),
    };

    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal(
      "CustomEvent",
      class TestCustomEvent extends Event {
        detail: unknown;

        constructor(type: string, init?: CustomEventInit) {
          super(type);
          this.detail = init?.detail;
        }
      }
    );
  });

  afterEach(() => {
    resetByokForTests();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("byok storage keeps unsaved key session only", () => {
    confirmByokSetup({
      providerId: "openrouter",
      modelId: "deepseek/deepseek-v4-flash",
      apiKey: "sk-session-only",
      saveKey: false,
      allowanceUsd: null,
    });

    expect(getSessionByokApiKey()).toBe("sk-session-only");
    expect(readByokConfig().hasSavedKey).toBe(false);
    expect(window.localStorage.getItem(BYOK_STORAGE_KEY)).not.toContain("sk-session-only");
  });

  it("byok saved key requires confirmation without revealing secret", () => {
    confirmByokSetup({
      providerId: "openrouter",
      modelId: "deepseek/deepseek-v4-flash",
      apiKey: "sk-persisted",
      saveKey: true,
      allowanceUsd: 2,
    });
    clearByokSessionForTests();

    const publicConfig = readByokConfig();
    expect(publicConfig.hasSavedKey).toBe(true);
    expect("savedKey" in publicConfig).toBe(false);
    expect(getSessionByokApiKey()).toBeNull();

    const confirmed = confirmSavedByokKey();
    expect(confirmed?.hasSavedKey).toBe(true);
    expect(getSessionByokApiKey()).toBe("sk-persisted");
  });

  it("byok allowance blocks exhausted requests", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    confirmByokSetup({
      providerId: "openrouter",
      modelId: "deepseek/deepseek-v4-flash",
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: 0,
    });

    const result = await sendByokLlmRequest({
      purpose: "test",
      messages: [{ role: "user", content: "hello" }],
    });

    expect(result).toEqual({ ok: false, error: "allowance_exceeded" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("byok provider usage updates allowance state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "answer" } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15, cost: 0.25 },
          }),
          { status: 200 }
        )
      )
    );

    confirmByokSetup({
      providerId: "openrouter",
      modelId: "deepseek/deepseek-v4-flash",
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: 1,
    });

    await sendByokLlmRequest({
      purpose: "test",
      messages: [{ role: "user", content: "hello" }],
    });

    expect(readByokConfig().usageUsd).toBe(0.25);
    expect(readByokConfig().usageCostSource).toBe("provider");
  });

  it("byok request boundary returns content and usage", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "usable answer" } }],
          usage: { total_tokens: 9, cost: 0.02 },
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal(
      "fetch",
      fetchMock
    );

    confirmByokSetup({
      providerId: "openrouter",
      modelId: "deepseek/deepseek-v4-flash",
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: null,
    });

    const result = await sendByokLlmRequest({
      purpose: "test",
      messages: [{ role: "user", content: "hello" }],
      responseFormat: "json",
    });

    expect(result).toMatchObject({
      ok: true,
      content: "usable answer",
      usage: {
        totalTokens: 9,
        costUsd: 0.02,
        costSource: "provider",
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer sk-test",
          "X-OpenRouter-Title": "de bedrijfskompas",
        },
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      model: "deepseek/deepseek-v4-flash",
      messages: [{ role: "user", content: "hello" }],
      response_format: { type: "json_object" },
    });
  });

  it("byok request boundary does not persist prompts or responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "secret model answer" } }],
            usage: { cost: 0.01 },
          }),
          { status: 200 }
        )
      )
    );

    confirmByokSetup({
      providerId: "openrouter",
      modelId: "deepseek/deepseek-v4-flash",
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: null,
    });

    await sendByokLlmRequest({
      purpose: "test",
      messages: [{ role: "user", content: "private prompt text" }],
    });

    const stored = window.localStorage.getItem(BYOK_STORAGE_KEY) ?? "";
    expect(stored).not.toContain("private prompt text");
    expect(stored).not.toContain("secret model answer");
  });

  it("byok normalizes invalid key and malformed responses", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    confirmByokSetup({
      providerId: "openrouter",
      modelId: "deepseek/deepseek-v4-flash",
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: null,
    });

    await expect(
      sendByokLlmRequest({ purpose: "test", messages: [{ role: "user", content: "hello" }] })
    ).resolves.toEqual({ ok: false, error: "invalid_key" });

    await expect(
      sendByokLlmRequest({ purpose: "test", messages: [{ role: "user", content: "hello" }] })
    ).resolves.toEqual({ ok: false, error: "malformed_response" });
  });
});
