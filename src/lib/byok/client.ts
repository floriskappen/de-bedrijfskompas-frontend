import { openRouterAdapter } from "./openrouter";
import { getByokProvider } from "./providers";
import {
  getSessionByokApiKey,
  isByokAllowanceExhausted,
  readByokConfig,
  updateByokUsage,
} from "./storage";
import type { ByokProviderAdapter, ByokProviderId, ByokRequest, ByokResult } from "./types";

const ADAPTERS: Record<ByokProviderId, ByokProviderAdapter> = {
  openrouter: openRouterAdapter,
};

export async function sendByokLlmRequest(request: ByokRequest): Promise<ByokResult> {
  const config = readByokConfig();
  const apiKey = getSessionByokApiKey();

  if (!apiKey) return { ok: false, error: "missing_config" };
  if (isByokAllowanceExhausted(config)) return { ok: false, error: "allowance_exceeded" };

  const provider = getByokProvider(config.providerId);
  const adapter = ADAPTERS[provider.id];
  const result = await adapter.send({
    ...request,
    apiKey,
    providerId: provider.id,
    modelId: config.modelId,
  });

  if (result.ok) {
    updateByokUsage(result.usage.costUsd, result.usage.costSource);
  }

  return result;
}
