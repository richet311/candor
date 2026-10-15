import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { createLogger } from "../lib/logger";

const log = createLogger("oauth-providers");

export interface OAuthProviderAvailability {
  google: boolean;
  github: boolean;
}

// What this build was configured with, so the buttons render with the page instead of popping in
// once the API answers, which on a free-tier API waking from idle can take up to a minute. The
// API's answer still wins once it arrives, so a provider the server isn't actually set up for
// disappears instead of leading to a sign-in that can't complete.
const BUILD_TIME_PROVIDERS: OAuthProviderAvailability = {
  google: Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID),
  github: import.meta.env.VITE_GITHUB_SIGNIN_ENABLED === "true",
};

// The server's answer can't change without a redeploy, so it's fetched once per page load and
// reused when moving between the login and signup pages.
let confirmedProviders: OAuthProviderAvailability | null = null;

export function useOAuthProviders() {
  const [providers, setProviders] = useState<OAuthProviderAvailability>(confirmedProviders ?? BUILD_TIME_PROVIDERS);

  useEffect(() => {
    if (confirmedProviders) return;
    let cancelled = false;

    apiFetch<{ providers: OAuthProviderAvailability }>("/auth/oauth/providers")
      .then((data) => {
        confirmedProviders = data.providers;
        if (!cancelled) setProviders(data.providers);
      })
      .catch((err) => log.warn("could not confirm which sign-in providers are configured, keeping this build's defaults", err));

    return () => {
      cancelled = true;
    };
  }, []);

  return providers;
}
