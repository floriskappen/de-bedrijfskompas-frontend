import type { ByokCostSource } from "./types";

export type ByokCostTokens = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type ByokCostEvent =
  | { phase: "pending"; requestId: string; purpose: string }
  | {
      phase: "landed";
      requestId: string;
      purpose: string;
      costUsd: number | null;
      costSource: ByokCostSource;
      tokens?: ByokCostTokens;
    }
  | { phase: "ended"; requestId: string; purpose: string };

export type ByokCostListener = (event: ByokCostEvent) => void;

const listeners = new Set<ByokCostListener>();

export function subscribeByokCost(listener: ByokCostListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitByokCostPending(payload: { requestId: string; purpose: string }): void {
  broadcast({ phase: "pending", requestId: payload.requestId, purpose: payload.purpose });
}

export function emitByokCostLanded(payload: {
  requestId: string;
  purpose: string;
  costUsd: number | null;
  costSource: ByokCostSource;
  tokens?: ByokCostTokens;
}): void {
  broadcast({
    phase: "landed",
    requestId: payload.requestId,
    purpose: payload.purpose,
    costUsd: payload.costUsd,
    costSource: payload.costSource,
    tokens: payload.tokens,
  });
}

export function emitByokCostEnded(payload: { requestId: string; purpose: string }): void {
  broadcast({ phase: "ended", requestId: payload.requestId, purpose: payload.purpose });
}

function broadcast(event: ByokCostEvent): void {
  for (const listener of listeners) listener(event);
}

export function resetByokCostForTests(): void {
  listeners.clear();
}
