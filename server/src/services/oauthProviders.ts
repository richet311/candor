import { env } from "../config/env.js";
import { createLogger } from "../lib/logger.js";
import { UnauthorizedError } from "../utils/AppError.js";

const log = createLogger("oauth-provider");

export interface OAuthProfile {
  providerAccountId: string;
  email: string;
  name: string;
}

export type OAuthProviderId = "github";

export interface OAuthProviderDef {
  id: OAuthProviderId;
  isConfigured(): boolean;
  authorizeUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string, extra?: Record<string, string>): Promise<OAuthProfile>;
}

async function requestJson(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    log.error({ url, status: res.status, body: body.slice(0, 500) }, "oauth provider request failed");
    throw new UnauthorizedError("Could not complete sign-in with this provider");
  }
  return res.json() as Promise<Record<string, unknown>>;
}

const github: OAuthProviderDef = {
  id: "github",
  isConfigured: () => Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  authorizeUrl(state, redirectUri) {
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: "read:user user:email",
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  },
  async exchangeCode(code, redirectUri) {
    const tokenRes = await requestJson("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const accessToken = tokenRes.access_token as string | undefined;
    if (!accessToken) throw new UnauthorizedError("GitHub did not return an access token");

    const headers = { Authorization: `Bearer ${accessToken}`, "User-Agent": "candor-app", Accept: "application/json" };
    const profile = await requestJson("https://api.github.com/user", { headers });
    const emails = (await requestJson("https://api.github.com/user/emails", { headers })) as unknown as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;

    const primaryEmail = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
    if (!primaryEmail) throw new UnauthorizedError("Your GitHub account has no verified email address");

    return {
      providerAccountId: String(profile.id),
      email: primaryEmail.email,
      name: (profile.name as string | null) || (profile.login as string),
    };
  },
};

const providers: Record<OAuthProviderId, OAuthProviderDef> = { github };

export function getProvider(id: string): OAuthProviderDef | undefined {
  return providers[id as OAuthProviderId];
}

export function listProviders(): OAuthProviderDef[] {
  return Object.values(providers);
}
