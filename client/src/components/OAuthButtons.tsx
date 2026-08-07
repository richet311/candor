import { API_BASE } from "../lib/api";
import { useOAuthProviders } from "../hooks/useOAuthProviders";
import { GoogleSignInButton } from "./GoogleSignInButton";

const REDIRECT_PROVIDERS: Array<{ id: "github"; label: string }> = [{ id: "github", label: "Continue with GitHub" }];

export function OAuthButtons({ onGoogleCredential }: { onGoogleCredential: (idToken: string) => void }) {
  const providers = useOAuthProviders();
  const hasAny = providers.google || providers.github;

  if (!hasAny) return null;

  return (
    <div className="flex flex-col gap-2">
      {providers.google && <GoogleSignInButton onCredential={onGoogleCredential} />}
      {REDIRECT_PROVIDERS.filter((p) => providers[p.id]).map((p) => (
        <a
          key={p.id}
          href={`${API_BASE}/auth/oauth/${p.id}/start`}
          className="flex w-full items-center justify-center rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-black/5"
        >
          {p.label}
        </a>
      ))}
    </div>
  );
}
