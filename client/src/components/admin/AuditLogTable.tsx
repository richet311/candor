import { useMemo, useState } from "react";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { ACTIVITY_CATEGORIES, describeAuditEntry, type ActivityCategory } from "../../lib/auditLabels";
import type { AuditLogEntry } from "../../lib/types";

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  const [filter, setFilter] = useState<ActivityCategory | "all">("all");

  const described = useMemo(() => entries.map((entry) => ({ entry, ...describeAuditEntry(entry) })), [entries]);
  const filtered = filter === "all" ? described : described.filter((row) => row.category === filter);

  if (entries.length === 0) {
    return <EmptyState title="No activity yet" description="Actions taken by your team will show up here, most recent first." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {ACTIVITY_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === c.id
                ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
                : "border-[var(--color-border)] text-[var(--color-ink-soft)] hover:border-[var(--color-navy)]/40"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--color-ink-soft)]">Nothing in this category yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                <th className="py-2 pr-4 font-medium">Activity</th>
                <th className="py-2 pr-4 font-medium">Who</th>
                <th className="py-2 pr-4 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map(({ entry, text, tone }) => (
                <tr key={entry.id}>
                  <td className="py-2 pr-4">
                    <Badge tone={tone}>{text}</Badge>
                  </td>
                  <td className="py-2 pr-4 text-[var(--color-ink-soft)]">{entry.actor?.name ?? "-"}</td>
                  <td className="py-2 pr-4 text-[var(--color-ink-soft)]">{new Date(entry.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
