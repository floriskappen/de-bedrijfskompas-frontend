import { BYOK_PROVIDERS, getByokModelsForCategory, getDefaultByokModelForCategory } from "./providers";
import type {
  ByokCostSource,
  ByokModelCategory,
  ByokProviderId,
  ByokSetupInput,
  ByokStoredConfig,
} from "./types";

export const BYOK_STORAGE_KEY = "de-bedrijfskompas:byok-llm:v1";
export const BYOK_CHANGED_EVENT = "bedrijfskompas:byok-llm-changed";

type StoredPayload = Partial<ByokStoredConfig> & { modelId?: unknown; savedKey?: unknown };

let sessionApiKey: string | null = null;

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeProviderId(value: unknown): ByokProviderId {
  return value === "openrouter" ? "openrouter" : "openrouter";
}

function normalizeModelByCategory(
  providerId: ByokProviderId,
  payload: StoredPayload
): Partial<Record<ByokModelCategory, string>> {
  const workerModels = getByokModelsForCategory(providerId, "worker");
  const frontierModels = getByokModelsForCategory(providerId, "frontier");
  const workerDefault = workerModels[0]?.id;

  const incoming = payload.modelByCategory;
  const legacyModelId = typeof payload.modelId === "string" ? payload.modelId : undefined;

  const result: Partial<Record<ByokModelCategory, string>> = {};

  const workerCandidate = typeof incoming?.worker === "string" ? incoming.worker : legacyModelId;
  result.worker = workerModels.some((model) => model.id === workerCandidate) ? workerCandidate : workerDefault;

  if (typeof incoming?.frontier === "string" && frontierModels.some((model) => model.id === incoming.frontier)) {
    result.frontier = incoming.frontier;
  }

  return result;
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
  const modelByCategory = normalizeModelByCategory(providerId, payload);
  const savedKey = typeof payload.savedKey === "string" && payload.savedKey.trim() ? payload.savedKey : null;

  return {
    providerId,
    modelByCategory,
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
    modelByCategory: payload.modelByCategory,
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
  const workerDefault = getDefaultByokModelForCategory(provider.id, "worker");
  return {
    providerId: provider.id,
    modelByCategory: { worker: workerDefault.id },
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
    modelByCategory: input.modelByCategory,
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

export interface ConfirmSavedByokKeyOptions {
  allowanceUsd?: number | null;
  modelByCategory?: Partial<Record<ByokModelCategory, string>>;
}

export function confirmSavedByokKey(options?: ConfirmSavedByokKeyOptions): ByokStoredConfig | null {
  const stored = readStoredPayload();
  if (!stored?.savedKey) return null;
  sessionApiKey = stored.savedKey;
  const modelByCategory = options?.modelByCategory
    ? normalizeModelByCategory(stored.providerId, { modelByCategory: options.modelByCategory })
    : stored.modelByCategory;
  return writeStoredPayload({
    ...stored,
    modelByCategory,
    allowanceUsd: options?.allowanceUsd === undefined ? stored.allowanceUsd : normalizeMoney(options.allowanceUsd, null),
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

export function clearByokKey(): ByokStoredConfig {
  sessionApiKey = null;
  const stored = readStoredPayload();
  if (!stored) return getDefaultByokConfig();
  return writeStoredPayload({
    ...stored,
    savedKey: null,
    saveKey: false,
    hasSavedKey: false,
  });
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
