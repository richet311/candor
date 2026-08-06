export function ProgressBar({ raisedCents, goalCents }: { raisedCents: number; goalCents: number }) {
  const pct = goalCents > 0 ? Math.min(100, Math.round((raisedCents / goalCents) * 100)) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
        <div className="h-full rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[var(--color-ink-soft)]">{pct}% of goal</span>
    </div>
  );
}
