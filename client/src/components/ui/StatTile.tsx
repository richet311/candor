export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper-raised)] px-5 py-4">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</span>
      <span className="text-2xl font-semibold text-[var(--color-ink)]">{value}</span>
      {hint && <span className="text-xs text-[var(--color-ink-soft)]">{hint}</span>}
    </div>
  );
}
