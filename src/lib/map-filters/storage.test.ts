import { afterEach, describe, expect, it, vi } from "vitest";
import type { CompanyFilters } from "../company-data/filters";
import {
  MAP_FILTERS_STORAGE_KEY,
  MAP_FILTERS_STORAGE_VERSION,
  clearMapFilters,
  getDefaultMapFilters,
  readMapFilters,
  writeMapFilters,
} from "./storage";

function stubLocalStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => store.clear()),
  };
  vi.stubGlobal("window", { localStorage });
  return { store, localStorage };
}

describe("map filter storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("map filters normalize malformed or obsolete storage", () => {
    const { store } = stubLocalStorage();
    store.set(
      MAP_FILTERS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 0,
        axisMinimums: {
          substance: "high",
          ecology: "future-level",
          power: "low",
        },
        selectedDomains: [
          "software-it",
          "unknown-domain",
          "software-it",
          42,
          "health-care",
        ],
        favoritesOnly: "yes",
      })
    );

    expect(readMapFilters()).toEqual({
      axisMinimums: {
        substance: "high",
        ecology: "none",
        power: "low",
        embeddedness: "none",
        posture: "none",
      },
      selectedDomains: ["software-it", "health-care"],
      favoritesOnly: false,
    });

    store.set(MAP_FILTERS_STORAGE_KEY, "{not json");
    expect(readMapFilters()).toEqual(getDefaultMapFilters());
  });

  it("writes a versioned normalized payload and removes all-default filters", () => {
    const { store, localStorage } = stubLocalStorage();
    const filters = {
      ...getDefaultMapFilters(),
      selectedDomains: ["software-it"],
      favoritesOnly: true,
    } satisfies CompanyFilters;

    writeMapFilters(filters);
    expect(JSON.parse(store.get(MAP_FILTERS_STORAGE_KEY) ?? "{}")).toEqual({
      schemaVersion: MAP_FILTERS_STORAGE_VERSION,
      ...filters,
    });

    writeMapFilters(getDefaultMapFilters());
    expect(store.has(MAP_FILTERS_STORAGE_KEY)).toBe(false);
    expect(localStorage.removeItem).toHaveBeenCalledWith(MAP_FILTERS_STORAGE_KEY);
  });

  it("map filters degrade safely when storage is unavailable", () => {
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("storage denied");
      },
    });

    expect(readMapFilters()).toEqual(getDefaultMapFilters());
    expect(() => writeMapFilters({ ...getDefaultMapFilters(), favoritesOnly: true })).not.toThrow();
    expect(() => clearMapFilters()).not.toThrow();

    const localStorage = {
      getItem: vi.fn(() => {
        throw new Error("read denied");
      }),
      setItem: vi.fn(() => {
        throw new Error("write denied");
      }),
      removeItem: vi.fn(() => {
        throw new Error("remove denied");
      }),
    };
    vi.stubGlobal("window", { localStorage });

    expect(readMapFilters()).toEqual(getDefaultMapFilters());
    expect(() => writeMapFilters({ ...getDefaultMapFilters(), favoritesOnly: true })).not.toThrow();
    expect(() => writeMapFilters(getDefaultMapFilters())).not.toThrow();
    expect(() => clearMapFilters()).not.toThrow();
  });
});
