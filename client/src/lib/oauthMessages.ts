import type { OAuthEvent } from "./types";

export function oauthWelcomeMessage(event: OAuthEvent | undefined, name: string): string {
  switch (event) {
    case "linked":
      return `Welcome back, ${name} — we linked this sign-in to your existing Candor account.`;
    case "created":
      return `Welcome, ${name} — your email is already verified since it came from your sign-in provider.`;
    case "returning":
    default:
      return `Welcome back, ${name}`;
  }
}
