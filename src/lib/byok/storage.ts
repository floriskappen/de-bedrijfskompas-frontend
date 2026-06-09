import { BYOK_PROVIDERS } from "./providers";
import type { ByokProviderId, ByokSetupInput, ByokStoredConfig, ByokCostSource } from "./types";

export const BYOK_STORAGE_KEY = "de-bedrijfskompas:byok-llm:v1";
export const BYOK_CHANGED_EVENT = "bedrijfskompas:byok-llm-changed";

type StoredPayload = Partial<ByokStoredConfig> & { savedKey?: unknown };

let sessionApiKey: string | null = null;

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeProviderId(value: unknown): ByokProviderId {
  return value === "openrouter" ? "openrouter" : "openrouter";
}

function normalizeModelId(providerId: ByokProviderId, value: unknown): string {
  const provider = BYOK_PROVIDERS[providerId];
  return typeof value === "string" && provider.models.some((model) => model.id === value)
    ? value
    : provider.defaultModelId;
}

function normalizeMoney(value: unknown, fallback: number | null): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  if (value < 0) return fallback;
  return Math.round(value * 1_000_000) / 1_000_000;
}

function normalizeUsageSource(value: unknown): ByokCostSource {
  if (value === "provider" || value === "estimated" || value === "unknown") return value;
  return "unknown";
}

function normalizeStoredConfig(value: unknown): ByokStoredConfig & { savedKey: string | null } {
  const payload = value && typeof value === "object" ? (value as StoredPayload) : {};
  const providerId = normalizeProviderId(payload.providerId);
  const modelId = normalizeModelId(providerId, payload.modelId);
  const savedKey = typeof payload.savedKey === "string" && payload.savedKey.trim() ? payload.savedKey : null;

  return {
    providerId,
    modelId,
    saveKey: Boolean(payload.saveKey && savedKey),
    hasSavedKey: Boolean(savedKey),
    allowanceUsd: normalizeMoney(payload.allowanceUsd, null),
    usageUsd: normalizeMoney(payload.usageUsd, 0) ?? 0,
    usageCostSource: normalizeUsageSource(payload.usageCostSource),
    confirmedAt: typeof payload.confirmedAt === "string" ? payload.confirmedAt : null,
    savedKey,
  };
}

function readStoredPayload(): (ByokStoredConfig & { savedKey: string | null }) | null {
  if (!hasWindow()) return null;

  try {
    const raw = window.localStorage.getItem(BYOK_STORAGE_KEY);
    if (!raw) return null;
    return normalizeStoredConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

function emitChange(config: ByokStoredConfig): void {
  if (!hasWindow()) return;
  window.dispatchEvent(new CustomEvent(BYOK_CHANGED_EVENT, { detail: config }));
}

function writeStoredPayload(payload: ByokStoredConfig & { savedKey: string | null }): ByokStoredConfig {
  const publicConfig = toPublicConfig(payload);
  if (!hasWindow()) return publicConfig;

  const stored: StoredPayload = {
    ...publicConfig,
    savedKey: payload.savedKey ?? undefined,
  };
  window.localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(stored));
  emitChange(publicConfig);
  return publicConfig;
}

function toPublicConfig(payload: ByokStoredConfig & { savedKey?: string | null }): ByokStoredConfig {
  return {
    providerId: payload.providerId,
    modelId: payload.modelId,
    saveKey: Boolean(payload.saveKey && payload.hasSavedKey),
    hasSavedKey: Boolean(payload.hasSavedKey),
    allowanceUsd: payload.allowanceUsd,
    usageUsd: payload.usageUsd,
    usageCostSource: payload.usageCostSource,
    confirmedAt: payload.confirmedAt,
  };
}

export function getDefaultByokConfig(): ByokStoredConfig {
  const provider = BYOK_PROVIDERS.openrouter;
  return {
    providerId: provider.id,
    modelId: provider.defaultModelId,
    saveKey: false,
    hasSavedKey: false,
    allowanceUsd: null,
    usageUsd: 0,
    usageCostSource: "unknown",
    confirmedAt: null,
  };
}

export function readByokConfig(): ByokStoredConfig {
  const stored = readStoredPayload();
  return stored ? toPublicConfig(stored) : getDefaultByokConfig();
}

export function getSessionByokApiKey(): string | null {
  return sessionApiKey;
}

export function hasConfirmedByokConfig(): boolean {
  return Boolean(sessionApiKey);
}

export function confirmByokSetup(input: ByokSetupInput): ByokStoredConfig {
  const providerId = normalizeProviderId(input.providerId);
  const apiKey = input.apiKey.trim();
  if (!apiKey) return readByokConfig();

  sessionApiKey = apiKey;
  const current = readStoredPayload();
  const payload = normalizeStoredConfig({
    ...(current ?? {}),
    providerId,
    modelId: normalizeModelId(providerId, input.modelId),
    saveKey: input.saveKey,
    savedKey: input.saveKey ? apiKey : current?.savedKey ?? undefined,
    allowanceUsd: normalizeMoney(input.allowanceUsd, null),
    usageUsd: current?.usageUsd ?? 0,
    usageCostSource: current?.usageCostSource ?? "unknown",
    confirmedAt: new Date().toISOString(),
  });

  if (!input.saveKey) {
    payload.saveKey = false;
    payload.hasSavedKey = Boolean(current?.savedKey);
    payload.savedKey = current?.savedKey ?? null;
  }

  return writeStoredPayload(payload);
}

export function confirmSavedByokKey(allowanceUsd?: number | null): ByokStoredConfig | null {
  const stored = readStoredPayload();
  if (!stored?.savedKey) return null;
  sessionApiKey = stored.savedKey;
  return writeStoredPayload({
    ...stored,
    allowanceUsd: allowanceUsd === undefined ? stored.allowanceUsd : normalizeMoney(allowanceUsd, null),
    confirmedAt: new Date().toISOString(),
  });
}

export function updateByokUsage(costUsd: number | null | undefined, source: ByokCostSource): ByokStoredConfig {
  const stored = readStoredPayload() ?? { ...getDefaultByokConfig(), savedKey: null };
  const nextCost = normalizeMoney(costUsd, null);
  const usageUsd = nextCost === null ? stored.usageUsd : stored.usageUsd + nextCost;
  return writeStoredPayload({
    ...stored,
    usageUsd,
    usageCostSource: source,
  });
}

export function isByokAllowanceExhausted(config: Pick<ByokStoredConfig, "allowanceUsd" | "usageUsd">): boolean {
  return config.allowanceUsd !== null && config.usageUsd >= config.allowanceUsd;
}

export function resetByokForTests(): void {
  sessionApiKey = null;
  if (hasWindow()) {
    window.localStorage.removeItem(BYOK_STORAGE_KEY);
  }
}

export function clearByokSessionForTests(): void {
  sessionApiKey = null;
}
