import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FAVORITES_CHANGED_EVENT,
  FAVORITES_STORAGE_KEY,
  isFavorite,
  readFavoriteIds,
  subscribeFavorites,
  toggleFavorite,
} from "./favorites";

describe("favorites storage", () => {
  beforeEach(() => {
    const events = new EventTarget();
    const store = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    };
    const fakeWindow = {
      localStorage,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events),
    };

    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal(
      "CustomEvent",
      class TestCustomEvent extends Event {
        detail: unknown;

        constructor(type: string, init?: CustomEventInit) {
          super(type);
          this.detail = init?.detail;
        }
      }
    );
    vi.stubGlobal(
      "StorageEvent",
      class TestStorageEvent extends Event {
        key: string | null;

        constructor(type: string, init?: StorageEventInit) {
          super(type);
          this.key = init?.key ?? null;
        }
      }
    );
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns an empty list when storage is missing", () => {
    expect(readFavoriteIds()).toEqual([]);
  });

  it("tolerates malformed storage", () => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, "{not json");

    expect(readFavoriteIds()).toEqual([]);
  });

  it("deduplicates ids and ignores non-string values", () => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify({ companyIds: ["land-life-company", 42, "", "gravity", "land-life-company"] })
    );

    expect(readFavoriteIds()).toEqual(["land-life-company", "gravity"]);
  });

  it("also accepts legacy array-shaped storage", () => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(["gravity", "gravity", null]));

    expect(readFavoriteIds()).toEqual(["gravity"]);
  });

  it("toggles favorite ids", () => {
    expect(isFavorite("gravity")).toBe(false);

    expect(toggleFavorite("gravity")).toEqual(["gravity"]);
    expect(isFavorite("gravity")).toBe(true);

    expect(toggleFavorite("gravity")).toEqual([]);
    expect(isFavorite("gravity")).toBe(false);
  });

  it("notifies subscribers after local writes and storage events", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeFavorites(listener);

    toggleFavorite("gravity");
    expect(listener).toHaveBeenCalledWith(["gravity"]);

    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify({ companyIds: ["land-life-company"] })
    );
    window.dispatchEvent(new StorageEvent("storage", { key: FAVORITES_STORAGE_KEY }));

    expect(listener).toHaveBeenCalledWith(["land-life-company"]);

    unsubscribe();
    window.dispatchEvent(
      new CustomEvent(FAVORITES_CHANGED_EVENT, { detail: { companyIds: ["amulet"] } })
    );
    expect(listener).not.toHaveBeenCalledWith(["amulet"]);
  });
});
