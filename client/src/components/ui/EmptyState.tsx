import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] px-6 py-12 text-center">
      <p className="text-sm font-medium text-[var(--color-ink)]">{title}</p>
      <p className="max-w-sm text-sm text-[var(--color-ink-soft)]">{description}</p>
      {action}
    </div>
  );
}
