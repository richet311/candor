import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "danger" | "accent";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-black/5 text-[var(--color-ink-soft)]",
  success: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  danger: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  accent: "bg-[var(--color-accent)]/10 text-[var(--color-accent-dark)]",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
