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

    async function load() {
      try {
        const data = await apiFetch<{ providers: OAuthProviderAvailability }>("/auth/oauth/providers");
        if (!cancelled) setProviders(data.providers);
      } catch (err) {
        log.warn("could not load which sign-in providers are configured", err);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return providers;
}
