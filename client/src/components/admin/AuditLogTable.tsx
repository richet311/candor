import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import type { AuditLogEntry } from "../../lib/types";

const SECURITY_ACTIONS = new Set(["auth.login_failed", "auth.account_locked", "auth.refresh_reuse_detected", "security.authz_denied"]);

function toneFor(action: string) {
  if (SECURITY_ACTIONS.has(action)) return "danger" as const;
  if (action.startsWith("donation")) return "success" as const;
  return "neutral" as const;
}

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState title="No activity yet" description="Actions taken by your team will show up here, most recent first." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            <th className="py-2 pr-4 font-medium">Action</th>
            <th className="py-2 pr-4 font-medium">Actor</th>
            <th className="py-2 pr-4 font-medium">When</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="py-2 pr-4">
                <Badge tone={toneFor(entry.action)}>{entry.action}</Badge>
              </td>
              <td className="py-2 pr-4 text-[var(--color-ink-soft)]">{entry.actor?.name ?? "—"}</td>
              <td className="py-2 pr-4 text-[var(--color-ink-soft)]">{new Date(entry.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
