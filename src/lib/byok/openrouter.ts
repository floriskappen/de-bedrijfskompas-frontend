import type { ByokProviderAdapter, ByokProviderRequest, ByokResult, ByokUsage } from "./types";

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

async function mapOpenRouterHttpError(response: Response): Promise<ByokResult> {
  if (response.status === 401 || response.status === 403) return { ok: false, error: "invalid_key" };
  if (response.status === 402) return { ok: false, error: "insufficient_credit" };
  if (response.status === 429) return { ok: false, error: "rate_limited" };

  const errorText = await readErrorText(response);
  if (errorText.includes("credit") || errorText.includes("balance")) {
    return { ok: false, error: "insufficient_credit" };
  }
  if (errorText.includes("key") || errorText.includes("auth")) {
    return { ok: false, error: "invalid_key" };
  }

  return { ok: false, error: "malformed_response" };
}

export const openRouterAdapter: ByokProviderAdapter = {
  id: "openrouter",
  async send(request: ByokProviderRequest): Promise<ByokResult> {
    try {
      const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
        method: "POST",
        signal: request.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${request.apiKey}`,
          "X-Title": "de bedrijfskompas",
        },
        body: JSON.stringify({
          model: request.modelId,
          messages: request.messages,
          temperature: request.temperature ?? 0.2,
          max_tokens: request.maxTokens,
          response_format: request.responseFormat === "json" ? { type: "json_object" } : undefined,
        }),
      });

      if (!response.ok) return mapOpenRouterHttpError(response);

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        return { ok: false, error: "malformed_response" };
      }

      return {
        ok: true,
        content,
        usage: extractUsage(payload?.usage),
      };
    } catch {
      return { ok: false, error: "network_error" };
    }
  },
};
