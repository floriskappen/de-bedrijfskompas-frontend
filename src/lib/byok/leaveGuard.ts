// Leave-warning guard for BYOM `06` principle 4 (no lost work). Fires a
// `beforeunload` warning when an in-flight paid request would be aborted OR a
// consuming feature has signaled unsaved work that would be lost. The
// in-flight-request count is co-located here (its only consumer) so the listener
// is managed directly on 0↔1 transitions with no cross-module subscription.

let inFlightRequests = 0;
const unsavedWorkKeys = new Set<string>();
let listenerAttached = false;

function beforeUnloadHandler(event: BeforeUnloadEvent): void {
  event.preventDefault();
  event.returnValue = "";
}

export function isByokLeaveGuarded(): boolean {
  return inFlightRequests > 0 || unsavedWorkKeys.size > 0;
}

function reconsider(): void {
  if (typeof window === "undefined") return;
  const guarded = isByokLeaveGuarded();
  if (guarded && !listenerAttached) {
    window.addEventListener("beforeunload", beforeUnloadHandler);
    listenerAttached = true;
  } else if (!guarded && listenerAttached) {
    window.removeEventListener("beforeunload", beforeUnloadHandler);
    listenerAttached = false;
  }
}

export function incByokInFlightRequest(): void {
  inFlightRequests += 1;
  if (inFlightRequests === 1) reconsider();
}

export function decByokInFlightRequest(): void {
  inFlightRequests = Math.max(0, inFlightRequests - 1);
  if (inFlightRequests === 0) reconsider();
}

export function readByokInFlightRequestCount(): number {
  return inFlightRequests;
}

// Features register unsaved-work by key so multiple features (or re-renders)
// cannot clobber each other; idempotent per key.
export function setByokUnsavedWork(key: string, active: boolean): void {
  const before = unsavedWorkKeys.size;
  if (active) unsavedWorkKeys.add(key);
  else unsavedWorkKeys.delete(key);
  if (unsavedWorkKeys.size !== before) reconsider();
}

export function resetByokLeaveGuardForTests(): void {
  inFlightRequests = 0;
  unsavedWorkKeys.clear();
  if (listenerAttached && typeof window !== "undefined") {
    window.removeEventListener("beforeunload", beforeUnloadHandler);
    listenerAttached = false;
  }
}
