import { API_BASE } from "../lib/api";
import { useOAuthProviders } from "../hooks/useOAuthProviders";
import { GoogleSignInButton } from "./GoogleSignInButton";

function GitHubIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

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
          className="flex w-full items-center justify-center gap-2.5 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-black/5"
        >
          <GitHubIcon />
          {p.label}
        </a>
      ))}
    </div>
  );
}
