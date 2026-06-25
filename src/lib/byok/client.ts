import { estimateByokRequestCost, isByokRequestWithinBudget, releaseByokEstimate, reserveByokEstimate } from "./budget";
import { emitByokCostEnded, emitByokCostLanded, emitByokCostPending } from "./cost";
import { appendByokSpendRecord } from "./history";
import { decByokInFlightRequest, incByokInFlightRequest } from "./leaveGuard";
import { openRouterAdapter } from "./openrouter";
import { getByokModel, getByokProvider } from "./providers";
import {
  clearByokKey,
  getSessionByokApiKey,
  isByokAllowanceExhausted,
  readByokConfig,
} from "./storage";
import type {
  ByokProviderAdapter,
  ByokProviderId,
  ByokRequest,
  ByokResult,
  ByokStreamError,
  ByokUsage,
} from "./types";

const ADAPTERS: Record<ByokProviderId, ByokProviderAdapter> = {
  openrouter: openRouterAdapter,
};

let requestCounter = 0;

function makeRequestId(): string {
  requestCounter += 1;
  return `byok-req-${requestCounter}`;
}

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
  const requestId = makeRequestId();
  const purpose = request.purpose;

  reserveByokEstimate(estimateUsd);
  incByokInFlightRequest();
  emitByokCostPending({ requestId, purpose });

  let content = "";
  let usage: ByokUsage | null = null;
  try {
    for await (const event of adapter.send({ ...request, apiKey, providerId: provider.id, modelId })) {
      if (event.type === "text") {
        content += event.delta;
      } else {
        usage = event.usage;
      }
    }
  } catch (error) {
    const errorCode = isByokStreamError(error) ? error.error : "network_error";
    if (errorCode === "invalid_key") clearByokKey();
    emitByokCostEnded({ requestId, purpose });
    return { ok: false, error: errorCode };
  } finally {
    releaseByokEstimate(estimateUsd);
    decByokInFlightRequest();
  }

  // The stream completed. The adapter guarantees a terminal usage event; an
  // empty body or missing usage is malformed and records no spend.
  if (!content.trim() || !usage) {
    emitByokCostEnded({ requestId, purpose });
    return { ok: false, error: "malformed_response" };
  }

  const tokens = {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
  };
  appendByokSpendRecord({
    purpose,
    costUsd: usage.costUsd ?? null,
    costSource: usage.costSource,
    tokens,
  });
  emitByokCostLanded({
    requestId,
    purpose,
    costUsd: usage.costUsd ?? null,
    costSource: usage.costSource,
    tokens,
  });

  return { ok: true, content, usage };
}

function isByokStreamError(value: unknown): value is ByokStreamError {
  return value instanceof Error && value.name === "ByokStreamError";
}
