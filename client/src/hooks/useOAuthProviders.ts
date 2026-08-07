import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { createLogger } from "../lib/logger";

const log = createLogger("oauth-providers");

export interface OAuthProviderAvailability {
  google: boolean;
  github: boolean;
}

const ALL_DISABLED: OAuthProviderAvailability = { google: false, github: false };

export function useOAuthProviders() {
  const [providers, setProviders] = useState<OAuthProviderAvailability>(ALL_DISABLED);

  useEffect(() => {
    let cancelled = false;

    // A cold-starting API (e.g. a free-tier host waking from idle) can miss this
    // first request entirely, so one retry keeps a slow wake-up from permanently
    // hiding the sign-in buttons for the rest of the page's life.
    async function load(isRetry = false) {
      try {
        const data = await apiFetch<{ providers: OAuthProviderAvailability }>("/auth/oauth/providers");
        if (!cancelled) setProviders(data.providers);
      } catch (err) {
        if (isRetry) {
          log.warn("could not load which sign-in providers are configured", err);
          return;
        }
        log.debug("providers request failed, retrying once", err);
        setTimeout(() => {
          if (!cancelled) void load(true);
        }, 2000);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return providers;
}
