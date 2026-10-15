import { useApiStatus } from "../lib/apiStatus";

// The free-tier API sleeps when it sits idle, and the first visitor after that waits up to a
// minute for it to wake. Saying so beats leaving them looking at spinners and empty stats.
export function ServerWakeNotice() {
  const status = useApiStatus();

  // The live region stays mounted so screen readers announce the message when it appears.
  return (
    <div role="status">
      {status !== "ok" && (
        <div className="flex items-center justify-center gap-2 border-t border-white/15 bg-[var(--color-accent-dark)] px-4 py-1.5 text-center text-xs text-white">
          {status === "waking" ? (
            <>
              <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
              Waking up the demo server. Free hosting sleeps when idle, so this can take up to a minute.
            </>
          ) : (
            "Can't reach the server right now. Try refreshing in a minute."
          )}
        </div>
      )}
    </div>
  );
}
