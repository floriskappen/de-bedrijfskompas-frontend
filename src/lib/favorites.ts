export const FAVORITES_STORAGE_KEY = "de-bedrijfskompas:favorites:v1";
export const FAVORITES_CHANGED_EVENT = "bedrijfskompas:favorites-changed";

type FavoritesPayload = { companyIds?: unknown };
type FavoritesListener = (ids: string[]) => void;

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeIds(value: unknown): string[] {
  let rawIds: unknown[] = [];

  if (Array.isArray(value)) {
    rawIds = value;
  } else if (value && typeof value === "object") {
    const payload = value as FavoritesPayload;
    if (Array.isArray(payload.companyIds)) {
      rawIds = payload.companyIds;
    }
  }

  const seen = new Set<string>();
  const ids: string[] = [];

  for (const id of rawIds) {
    if (typeof id !== "string") continue;
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    ids.push(trimmed);
  }

  return ids;
}

export function readFavoriteIds(): string[] {
  if (!hasWindow()) return [];

  try {
    const value = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!value) return [];
    return normalizeIds(JSON.parse(value));
  } catch {
    return [];
  }
}

function writeFavoriteIds(ids: string[]): string[] {
  if (!hasWindow()) return [];

  const normalized = normalizeIds(ids);
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ companyIds: normalized }));
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT, { detail: { companyIds: normalized } }));
  return normalized;
}

export function isFavorite(companyId: string): boolean {
  return readFavoriteIds().includes(companyId);
}

export function setFavorite(companyId: string, nextFavorite: boolean): string[] {
  const current = readFavoriteIds();
  const exists = current.includes(companyId);

  if (nextFavorite && !exists) {
    return writeFavoriteIds([...current, companyId]);
  }

  if (!nextFavorite && exists) {
    return writeFavoriteIds(current.filter((id) => id !== companyId));
  }

  return current;
}

export function toggleFavorite(companyId: string): string[] {
  return setFavorite(companyId, !isFavorite(companyId));
}

export function subscribeFavorites(listener: FavoritesListener): () => void {
  if (!hasWindow()) return () => {};

  const notify = () => listener(readFavoriteIds());

  const handleCustom = (event: Event) => {
    const ids = normalizeIds((event as CustomEvent).detail?.companyIds);
    listener(ids);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== FAVORITES_STORAGE_KEY) return;
    notify();
  };

  window.addEventListener(FAVORITES_CHANGED_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(FAVORITES_CHANGED_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}
