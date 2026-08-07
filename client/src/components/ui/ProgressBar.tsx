export function ProgressBar({ raisedCents, goalCents }: { raisedCents: number; goalCents: number }) {
  const pct = goalCents > 0 ? Math.min(100, Math.round((raisedCents / goalCents) * 100)) : 0;
  const barWidth = raisedCents > 0 ? Math.max(pct, 2) : 0;
  const label = pct === 0 && raisedCents > 0 ? "<1% of goal" : `${pct}% of goal`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-3 w-full overflow-hidden rounded-full bg-black/10">
        <div className="h-full rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${barWidth}%` }} />
      </div>
      <span className="text-xs text-[var(--color-ink-soft)]">{label}</span>
    </div>
  );
}
