import { useSyncExternalStore } from "react";

// "waking": requests are hanging or failing the way they do while the free-tier API spins back up
// after sitting idle. "unreachable": a request retried through that whole wake-up window and still
// got no answer. Set from api.ts, read by ServerWakeNotice.
export type ApiStatus = "ok" | "waking" | "unreachable";

let status: ApiStatus = "ok";
const listeners = new Set<() => void>();

export function setApiStatus(next: ApiStatus) {
  if (next === status) return;
  status = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useApiStatus() {
  return useSyncExternalStore(subscribe, () => status);
}
