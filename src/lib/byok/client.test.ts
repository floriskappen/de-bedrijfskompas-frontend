import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BYOK_PROVIDERS,
  BYOK_STORAGE_KEY,
  clearByokSessionForTests,
  confirmByokSetup,
  confirmSavedByokKey,
  getSessionByokApiKey,
  readByokConfig,
  readByokInFlightUsd,
  resetByokBudgetForTests,
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
    resetByokBudgetForTests();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("byok storage keeps unsaved key session only", () => {
    confirmByokSetup({
      providerId: "openrouter",
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
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
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
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
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: 0,
    });

    const result = await sendByokLlmRequest({
      purpose: "test",
      category: "worker",
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
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: 1,
    });

    await sendByokLlmRequest({
      purpose: "test",
      category: "worker",
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
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: null,
    });

    const result = await sendByokLlmRequest({
      purpose: "test",
      category: "worker",
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
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: null,
    });

    await sendByokLlmRequest({
      purpose: "test",
      category: "worker",
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
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: null,
    });

    await expect(
      sendByokLlmRequest({ purpose: "test", category: "worker", messages: [{ role: "user", content: "hello" }] })
    ).resolves.toEqual({ ok: false, error: "invalid_key" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getSessionByokApiKey()).toBeNull();

    confirmByokSetup({
      providerId: "openrouter",
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: null,
    });

    await expect(
      sendByokLlmRequest({ purpose: "test", category: "worker", messages: [{ role: "user", content: "hello" }] })
    ).resolves.toEqual({ ok: false, error: "malformed_response" });
  });

  it("invalid_key clears session and saved key without retry", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("unauthorized", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    confirmByokSetup({
      providerId: "openrouter",
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-saved",
      saveKey: true,
      allowanceUsd: null,
    });
    expect(getSessionByokApiKey()).toBe("sk-saved");
    expect(readByokConfig().hasSavedKey).toBe(true);

    const result = await sendByokLlmRequest({
      purpose: "test",
      category: "worker",
      messages: [{ role: "user", content: "hello" }],
    });

    expect(result).toEqual({ ok: false, error: "invalid_key" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getSessionByokApiKey()).toBeNull();
    expect(readByokConfig().hasSavedKey).toBe(false);
  });

  it("byok pre-flight estimate blocks over-budget request before fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    confirmByokSetup({
      providerId: "openrouter",
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: 0.005,
    });

    const result = await sendByokLlmRequest({
      purpose: "test",
      category: "worker",
      messages: [{ role: "user", content: "hello" }],
      maxTokens: 5000,
    });

    expect(result).toEqual({ ok: false, error: "allowance_exceeded" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("byok concurrent in-flight requests cannot overshoot ceiling", async () => {
    let resolveFetchA!: (response: Response) => void;
    const fetchAPromise = new Promise<Response>((resolve) => {
      resolveFetchA = resolve;
    });
    const fetchMock = vi.fn().mockReturnValueOnce(fetchAPromise);
    vi.stubGlobal("fetch", fetchMock);

    confirmByokSetup({
      providerId: "openrouter",
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: 0.015,
    });

    const callA = sendByokLlmRequest({
      purpose: "test",
      category: "worker",
      messages: [{ role: "user", content: "hello" }],
      maxTokens: 5000,
    });
    await Promise.resolve();

    const resultB = await sendByokLlmRequest({
      purpose: "test",
      category: "worker",
      messages: [{ role: "user", content: "hello" }],
      maxTokens: 5000,
    });

    expect(resultB).toEqual({ ok: false, error: "allowance_exceeded" });

    resolveFetchA(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "answer a" } }],
          usage: { cost: 0.001 },
        }),
        { status: 200 }
      )
    );
    const resultA = await callA;

    expect(resultA).toMatchObject({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("byok failed request releases in-flight reservation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("unauthorized", { status: 401 })));

    confirmByokSetup({
      providerId: "openrouter",
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: null,
    });

    expect(readByokInFlightUsd()).toBe(0);

    const result = await sendByokLlmRequest({
      purpose: "test",
      category: "worker",
      messages: [{ role: "user", content: "hello" }],
      maxTokens: 5000,
    });

    expect(result).toEqual({ ok: false, error: "invalid_key" });
    expect(readByokInFlightUsd()).toBe(0);
  });

  it("byok unset allowance skips ceiling check", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "answer" } }],
          usage: { cost: 0.01 },
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    confirmByokSetup({
      providerId: "openrouter",
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: null,
    });

    const result = await sendByokLlmRequest({
      purpose: "test",
      category: "worker",
      messages: [{ role: "user", content: "hello" }],
      maxTokens: 50000,
    });

    expect(result).toMatchObject({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("boundary routes by declared category", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "answer" } }],
          usage: { cost: 0.01 },
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    confirmByokSetup({
      providerId: "openrouter",
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: null,
    });

    await sendByokLlmRequest({
      purpose: "test",
      category: "worker",
      messages: [{ role: "user", content: "hello" }],
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      model: "deepseek/deepseek-v4-flash",
    });
  });

  it("unconfigured category is refused before the provider call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    confirmByokSetup({
      providerId: "openrouter",
      modelByCategory: { worker: "deepseek/deepseek-v4-flash" },
      apiKey: "sk-test",
      saveKey: false,
      allowanceUsd: null,
    });

    const result = await sendByokLlmRequest({
      purpose: "test",
      category: "frontier",
      messages: [{ role: "user", content: "hello" }],
    });

    expect(result).toEqual({ ok: false, error: "missing_config" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("legacy saved model migrates to the worker category", () => {
    window.localStorage.setItem(
      BYOK_STORAGE_KEY,
      JSON.stringify({
        providerId: "openrouter",
        modelId: "deepseek/deepseek-v4-flash",
        saveKey: true,
        savedKey: "sk-legacy",
        hasSavedKey: true,
        allowanceUsd: null,
        usageUsd: 0,
        usageCostSource: "unknown",
        confirmedAt: "2026-06-01T00:00:00.000Z",
      })
    );

    const config = readByokConfig();
    expect(config.modelByCategory.worker).toBe("deepseek/deepseek-v4-flash");
    expect(config.hasSavedKey).toBe(true);

    const confirmed = confirmSavedByokKey();
    expect(confirmed?.modelByCategory.worker).toBe("deepseek/deepseek-v4-flash");
    expect(getSessionByokApiKey()).toBe("sk-legacy");
  });

  it("byok provider registry has no pinned default model", () => {
    expect("defaultModelId" in BYOK_PROVIDERS.openrouter).toBe(false);
    expect(BYOK_PROVIDERS.openrouter.models.every((m) => "category" in m)).toBe(true);
  });
});
