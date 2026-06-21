import {
  DEFAULT_AXIS_MINIMUMS,
  hasActiveFilters,
  type CompanyFilters,
} from "../company-data/filters";
import { FOCUS_LEVEL_ORDER, type FocusLevel } from "../company-data/focus-level";
import {
  AXIS_IDS,
  DOMAIN_GROUP_IDS,
  type AxisId,
  type DomainGroupId,
} from "../company-data/types";

export const MAP_FILTERS_STORAGE_KEY = "de-bedrijfskompas:map-filters:v1";
export const MAP_FILTERS_STORAGE_VERSION = 1;

export interface MapFiltersStoragePayload extends CompanyFilters {
  schemaVersion: typeof MAP_FILTERS_STORAGE_VERSION;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getDefaultMapFilters(): CompanyFilters {
  return {
    axisMinimums: { ...DEFAULT_AXIS_MINIMUMS },
    selectedDomains: [],
    favoritesOnly: false,
  };
}

function normalizeFocusLevel(value: unknown): FocusLevel {
  return typeof value === "string" && FOCUS_LEVEL_ORDER.includes(value as FocusLevel)
    ? (value as FocusLevel)
    : "none";
}

function normalizeAxisMinimums(value: unknown): CompanyFilters["axisMinimums"] {
  const source = isRecord(value) ? value : {};

  return AXIS_IDS.reduce(
    (minimums, axis) => {
      minimums[axis] = normalizeFocusLevel(source[axis]);
      return minimums;
    },
    {} as Record<AxisId, FocusLevel>
  );
}

function normalizeSelectedDomains(value: unknown): DomainGroupId[] {
  if (!Array.isArray(value)) return [];

  const supportedDomains = new Set<unknown>(DOMAIN_GROUP_IDS);
  const seen = new Set<DomainGroupId>();
  const normalized: DomainGroupId[] = [];

  for (const domain of value) {
    if (!supportedDomains.has(domain) || seen.has(domain as DomainGroupId)) continue;
    seen.add(domain as DomainGroupId);
    normalized.push(domain as DomainGroupId);
  }

  return normalized;
}

export function normalizeMapFilters(value: unknown): CompanyFilters {
  const source = isRecord(value) ? value : {};

  return {
    axisMinimums: normalizeAxisMinimums(source.axisMinimums),
    selectedDomains: normalizeSelectedDomains(source.selectedDomains),
    favoritesOnly: source.favoritesOnly === true,
  };
}

export function readMapFilters(): CompanyFilters {
  const storage = getLocalStorage();
  if (!storage) return getDefaultMapFilters();

  try {
    const raw = storage.getItem(MAP_FILTERS_STORAGE_KEY);
    return raw ? normalizeMapFilters(JSON.parse(raw)) : getDefaultMapFilters();
  } catch {
    return getDefaultMapFilters();
  }
}

export function writeMapFilters(filters: CompanyFilters): CompanyFilters {
  const normalized = normalizeMapFilters(filters);
  const storage = getLocalStorage();
  if (!storage) return normalized;

  try {
    if (!hasActiveFilters(normalized)) {
      storage.removeItem(MAP_FILTERS_STORAGE_KEY);
      return normalized;
    }

    const payload: MapFiltersStoragePayload = {
      schemaVersion: MAP_FILTERS_STORAGE_VERSION,
      ...normalized,
    };
    storage.setItem(MAP_FILTERS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Browser storage is optional; keep the current in-memory filters usable.
  }

  return normalized;
}

export function clearMapFilters(): void {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    storage.removeItem(MAP_FILTERS_STORAGE_KEY);
  } catch {
    // Browser storage is optional; reset still updates the in-memory state.
  }
}
