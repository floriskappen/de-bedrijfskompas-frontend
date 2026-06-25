import { readByokUsageUsd } from "./history";
import type { ByokModelConfig, ByokRequest, ByokStoredConfig } from "./types";

// Conservative fallback USD-per-token rate used ONLY for the budget ceiling guard
// when a model's pricing is unknown (the current pre-categories world, where the
// single model carries null pricing). Sized to over-estimate against cheap-flash
// pricing so the guard never under-blocks. It is never the displayed cost: displayed
// cost comes from provider-reported real usage (cost-transparency, change E). When
// change C supplies real per-model pricing, this fallback is no longer hit.
export const FALLBACK_USD_PER_TOKEN = 0.000_002;

const CHARS_PER_TOKEN = 4;
const DEFAULT_MAX_TOKENS = 2048;
const TOKENS_PER_MILLION = 1_000_000;

let inFlightUsd = 0;

export function estimateByokRequestCost(
  request: Pick<ByokRequest, "messages" | "maxTokens">,
  model: ByokModelConfig
): number {
  const inputChars = request.messages.reduce((sum, message) => sum + message.content.length, 0);
  const inputTokens = Math.ceil(inputChars / CHARS_PER_TOKEN);
  const outputTokens = request.maxTokens ?? DEFAULT_MAX_TOKENS;

  const inputUsdPerToken =
    model.inputUsdPerMillionTokens !== null
      ? model.inputUsdPerMillionTokens / TOKENS_PER_MILLION
      : FALLBACK_USD_PER_TOKEN;
  const outputUsdPerToken =
    model.outputUsdPerMillionTokens !== null
      ? model.outputUsdPerMillionTokens / TOKENS_PER_MILLION
      : FALLBACK_USD_PER_TOKEN;

  return inputTokens * inputUsdPerToken + outputTokens * outputUsdPerToken;
}

export function readByokInFlightUsd(): number {
  return inFlightUsd;
}

export function reserveByokEstimate(estimateUsd: number): void {
  inFlightUsd += estimateUsd;
}

export function releaseByokEstimate(estimateUsd: number): void {
  inFlightUsd = Math.max(0, inFlightUsd - estimateUsd);
}

// A request is within budget when the visitor has set no allowance (no ceiling) or
// when derived cumulative usage plus in-flight reservations plus this estimate
// still fits. Cumulative usage is derived from the local spend history.
export function isByokRequestWithinBudget(
  config: Pick<ByokStoredConfig, "allowanceUsd">,
  estimateUsd: number
): boolean {
  if (config.allowanceUsd === null) return true;
  return readByokUsageUsd() + inFlightUsd + estimateUsd <= config.allowanceUsd;
}

export function resetByokBudgetForTests(): void {
  inFlightUsd = 0;
}
