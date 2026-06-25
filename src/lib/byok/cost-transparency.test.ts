import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BYOK_SPEND_STORAGE_KEY,
  appendByokSpendRecord,
  clearByokSpendHistory,
  readByokSpendHistory,
  readByokUsageUsd,
  resetByokHistoryForTests,
} from "./history";
import {
  emitByokCostEnded,
  emitByokCostLanded,
  emitByokCostPending,
  resetByokCostForTests,
  subscribeByokCost,
} from "./cost";
import {
  decByokInFlightRequest,
  incByokInFlightRequest,
  isByokLeaveGuarded,
  resetByokLeaveGuardForTests,
  setByokUnsavedWork,
} from "./leaveGuard";

describe("byok cost transparency", () => {
  beforeEach(() => {
    const events = new EventTarget();
    const store = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
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
  });

  afterEach(() => {
    resetByokHistoryForTests();
    resetByokCostForTests();
    resetByokLeaveGuardForTests();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("cost bus delivers pending then landed to subscribers", () => {
    const received: string[] = [];
    subscribeByokCost((event) => received.push(event.phase));

    emitByokCostPending({ requestId: "r1", purpose: "ikigai-pass-1" });
    emitByokCostLanded({
      requestId: "r1",
      purpose: "ikigai-pass-1",
      costUsd: 0.0123,
      costSource: "provider",
      tokens: { totalTokens: 5 },
    });

    expect(received).toEqual(["pending", "landed"]);
  });

  it("cost bus ended event reaches subscribers", () => {
    const received: string[] = [];
    subscribeByokCost((event) => received.push(event.phase));

    emitByokCostEnded({ requestId: "r2", purpose: "ikigai-pass-2" });
    expect(received).toEqual(["ended"]);
  });

  it("history appends records and derives cumulative usage", () => {
    appendByokSpendRecord({ purpose: "ikigai-pass-1", costUsd: 0.01, costSource: "provider" });
    appendByokSpendRecord({ purpose: "ikigai-pass-2", costUsd: 0.02, costSource: "provider" });

    expect(readByokSpendHistory()).toHaveLength(2);
    expect(readByokUsageUsd()).toBeCloseTo(0.03, 7);
  });

  it("history never stores prompt or response content", () => {
    appendByokSpendRecord({ purpose: "ikigai-pass-1", costUsd: 0.01, costSource: "provider" });

    const stored = window.localStorage.getItem(BYOK_SPEND_STORAGE_KEY) ?? "";
    expect(stored).not.toContain("private prompt text");
    expect(stored).not.toContain("secret model answer");
    const parsed = JSON.parse(stored) as Array<Record<string, unknown>>;
    expect(parsed[0]).not.toHaveProperty("prompt");
    expect(parsed[0]).not.toHaveProperty("content");
    expect(parsed[0]).not.toHaveProperty("messages");
  });

  it("clearByokSpendHistory empties the record list", () => {
    appendByokSpendRecord({ purpose: "ikigai-pass-1", costUsd: 0.01, costSource: "provider" });
    clearByokSpendHistory();
    expect(readByokSpendHistory()).toHaveLength(0);
    expect(readByokUsageUsd()).toBe(0);
  });

  it("leave guard predicate is guarded during in-flight or unsaved work", () => {
    expect(isByokLeaveGuarded()).toBe(false);

    incByokInFlightRequest();
    expect(isByokLeaveGuarded()).toBe(true);
    decByokInFlightRequest();
    expect(isByokLeaveGuarded()).toBe(false);

    setByokUnsavedWork("ikigai", true);
    expect(isByokLeaveGuarded()).toBe(true);
    setByokUnsavedWork("ikigai", false);
    expect(isByokLeaveGuarded()).toBe(false);
  });

  it("leave guard is guarded while either signal is active", () => {
    incByokInFlightRequest();
    setByokUnsavedWork("ikigai", true);
    expect(isByokLeaveGuarded()).toBe(true);

    decByokInFlightRequest();
    expect(isByokLeaveGuarded()).toBe(true); // unsaved work still active

    setByokUnsavedWork("ikigai", false);
    expect(isByokLeaveGuarded()).toBe(false);
  });
});
