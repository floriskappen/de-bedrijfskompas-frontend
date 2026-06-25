import { estimateByokRequestCost, isByokRequestWithinBudget, releaseByokEstimate, reserveByokEstimate } from "./budget";
import { openRouterAdapter } from "./openrouter";
import { getByokModel, getByokProvider } from "./providers";
import {
  clearByokKey,
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

  const modelId = config.modelByCategory[request.category];
  if (!modelId) return { ok: false, error: "missing_config" };

  const estimateUsd = estimateByokRequestCost(request, getByokModel(config.providerId, modelId));
  if (!isByokRequestWithinBudget(config, estimateUsd)) {
    return { ok: false, error: "allowance_exceeded" };
  }

  const provider = getByokProvider(config.providerId);
  const adapter = ADAPTERS[provider.id];
  reserveByokEstimate(estimateUsd);
  let result: ByokResult;
  try {
    result = await adapter.send({
      ...request,
      apiKey,
      providerId: provider.id,
      modelId,
    });
  } finally {
    releaseByokEstimate(estimateUsd);
  }

  if (result.ok) {
    updateByokUsage(result.usage.costUsd, result.usage.costSource);
  } else if (result.error === "invalid_key") {
    clearByokKey();
  }

  return result;
}
