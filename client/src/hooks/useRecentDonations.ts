import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { createLogger } from "../lib/logger";
import type { RecentDonation } from "../lib/types";

const log = createLogger("recent-donations");
const POLL_MS = 20_000;

export function useRecentDonations() {
  const [donations, setDonations] = useState<RecentDonation[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiFetch<{ donations: RecentDonation[] }>("/donations/recent");
        if (!cancelled) setDonations(data.donations);
      } catch (err) {
        // Silent: this is a homepage decoration, not a page-blocking feature.
        // A toast here would be noise for something the user didn't ask for.
        log.warn("could not load recent donations", err);
      }
    }

    void load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return donations;
}
