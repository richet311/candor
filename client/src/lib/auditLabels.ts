import { formatCents } from "./money";
import type { AuditLogEntry } from "./types";

export type ActivityCategory = "donations" | "funds" | "account" | "profile" | "security";
type Tone = "neutral" | "success" | "danger";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function metaAmount(entry: AuditLogEntry): string | null {
  return typeof entry.metadata?.amountCents === "number" ? formatCents(entry.metadata.amountCents) : null;
}

function metaString(entry: AuditLogEntry, key: string): string | null {
  return typeof entry.metadata?.[key] === "string" ? (entry.metadata[key] as string) : null;
}

export function describeAuditEntry(entry: AuditLogEntry): { text: string; category: ActivityCategory; tone: Tone } {
  const amount = metaAmount(entry);
  const fundName = metaString(entry, "fundName");

  switch (entry.action) {
    case "auth.register":
      return { text: "Created an account", category: "account", tone: "neutral" };
    case "auth.login_success":
      return { text: "Logged in", category: "account", tone: "neutral" };
    case "auth.login_failed":
      return { text: "Failed login attempt", category: "security", tone: "danger" };
    case "auth.account_locked":
      return { text: "Account locked after repeated failed logins", category: "security", tone: "danger" };
    case "auth.google_login":
      return { text: "Logged in with Google", category: "account", tone: "neutral" };
    case "auth.oauth_login": {
      const provider = metaString(entry, "provider");
      return { text: `Logged in with ${provider ? capitalize(provider) : "a linked account"}`, category: "account", tone: "neutral" };
    }
    case "auth.refresh_reuse_detected":
      return { text: "Suspicious sign-in activity detected", category: "security", tone: "danger" };
    case "auth.logout":
      return { text: "Logged out", category: "account", tone: "neutral" };
    case "auth.email_verified":
      return { text: "Verified their email", category: "account", tone: "success" };
    case "auth.email_verification_resent":
      return { text: "Requested a new verification email", category: "account", tone: "neutral" };
    case "user.profile_updated":
      return { text: "Updated their profile", category: "profile", tone: "neutral" };
    case "org.profile_updated":
      return { text: "Updated the organization profile", category: "profile", tone: "neutral" };
    case "fund.created": {
      const name = metaString(entry, "name");
      return { text: name ? `Created the fund "${name}"` : "Created a fund", category: "funds", tone: "neutral" };
    }
    case "fund.updated":
      return { text: "Updated a fund", category: "funds", tone: "neutral" };
    case "expense.logged": {
      const category = metaString(entry, "category");
      if (amount && category) return { text: `Logged a ${amount} expense (${category})`, category: "funds", tone: "neutral" };
      return { text: "Logged an expense", category: "funds", tone: "neutral" };
    }
    case "donation.initiated":
      return {
        text: amount && fundName ? `Started a ${amount} donation to ${fundName}` : "Started a donation",
        category: "donations",
        tone: "neutral",
      };
    case "donation.succeeded":
      return {
        text: amount && fundName ? `Sent a ${amount} donation to ${fundName}` : "Sent a donation",
        category: "donations",
        tone: "success",
      };
    case "donation.failed":
      return {
        text: amount && fundName ? `A ${amount} donation to ${fundName} failed` : "A donation failed",
        category: "donations",
        tone: "danger",
      };
    case "webhook.signature_invalid":
      return { text: "Blocked an invalid payment webhook", category: "security", tone: "danger" };
    case "security.rate_limit_exceeded":
      return { text: "Blocked repeated requests", category: "security", tone: "danger" };
    case "security.authz_denied":
      return { text: "Blocked an unauthorized action", category: "security", tone: "danger" };
    default:
      return { text: entry.action, category: "account", tone: "neutral" };
  }
}

export const ACTIVITY_CATEGORIES: Array<{ id: ActivityCategory | "all"; label: string }> = [
  { id: "all", label: "All activity" },
  { id: "donations", label: "Donations" },
  { id: "funds", label: "Funds & expenses" },
  { id: "account", label: "Account & sign-in" },
  { id: "profile", label: "Profile updates" },
  { id: "security", label: "Security alerts" },
];
