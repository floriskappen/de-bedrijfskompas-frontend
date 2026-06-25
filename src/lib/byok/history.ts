import type { ByokCostSource } from "./types";
import type { ByokCostTokens } from "./cost";

export const BYOK_SPEND_STORAGE_KEY = "de-bedrijfskompas:byok-spend:v1";
export const BYOK_SPEND_CHANGED_EVENT = "bedrijfskompas:byok-spend-changed";

export interface ByokSpendRecord {
  id: string;
  purpose: string;
  costUsd: number | null;
  costSource: ByokCostSource;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  timestamp: string;
}

export interface ByokSpendInput {
  purpose: string;
  costUsd: number | null;
  costSource: ByokCostSource;
  tokens?: ByokCostTokens;
}

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeRecord(value: unknown): ByokSpendRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const purpose = typeof record.purpose === "string" ? record.purpose : "";
  if (!purpose) return null;
  const costSource: ByokCostSource = record.costSource === "provider" ? "provider" : "unknown";
  const costUsd =
    typeof record.costUsd === "number" && Number.isFinite(record.costUsd) ? record.costUsd : null;
  const getNum = (key: string): number | undefined => {
    const v = record[key];
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
  };
  return {
    id: typeof record.id === "string" ? record.id : cryptoSpareId(),
    purpose,
    costUsd,
    costSource,
    promptTokens: getNum("promptTokens"),
    completionTokens: getNum("completionTokens"),
    totalTokens: getNum("totalTokens"),
    timestamp: typeof record.timestamp === "string" ? record.timestamp : new Date(0).toISOString(),
  };
}

function cryptoSpareId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `spend-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readRaw(): ByokSpendRecord[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(BYOK_SPEND_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRecord).filter((r): r is ByokSpendRecord => r !== null);
  } catch {
    return [];
  }
}

function emitChange(): void {
  if (!hasWindow()) return;
  window.dispatchEvent(new CustomEvent(BYOK_SPEND_CHANGED_EVENT));
}

// Best-effort persistence: a storage failure (e.g. quota) must never turn a
// successful LLM call into a failure, so writes are swallowed. Spend records are
// tiny and low-volume, so no count cap is applied.
function writeRaw(records: ByokSpendRecord[]): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(BYOK_SPEND_STORAGE_KEY, JSON.stringify(records));
    emitChange();
  } catch {
    // best-effort — leave the in-memory truth to the next read
  }
}

export function readByokSpendHistory(): ByokSpendRecord[] {
  return readRaw();
}

export function appendByokSpendRecord(input: ByokSpendInput): ByokSpendRecord {
  const record: ByokSpendRecord = {
    id: cryptoSpareId(),
    purpose: input.purpose,
    costUsd: input.costUsd,
    costSource: input.costSource,
    promptTokens: input.tokens?.promptTokens,
    completionTokens: input.tokens?.completionTokens,
    totalTokens: input.tokens?.totalTokens,
    timestamp: new Date().toISOString(),
  };
  const records = readRaw();
  records.push(record);
  writeRaw(records);
  return record;
}

export function clearByokSpendHistory(): void {
  writeRaw([]);
}

export function readByokUsageUsd(): number {
  return readRaw().reduce((sum, record) => sum + (record.costUsd ?? 0), 0);
}

export function resetByokHistoryForTests(): void {
  if (hasWindow()) {
    window.localStorage.removeItem(BYOK_SPEND_STORAGE_KEY);
  }
}
