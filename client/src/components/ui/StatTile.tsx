export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-paper-raised)] px-6 py-5 shadow-[0_1px_2px_rgba(18,32,58,0.04),0_12px_28px_-10px_rgba(18,32,58,0.12)]">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</span>
      <span className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">{value}</span>
      {hint && <span className="text-xs text-[var(--color-ink-soft)]">{hint}</span>}
    </div>
  );
}
