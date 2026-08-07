export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex w-fit flex-col ${className}`}>
      <span className="italic leading-none tracking-tight" style={{ fontFamily: "var(--font-logo)", fontWeight: 600 }}>
        Candor
      </span>
      <svg viewBox="0 0 120 12" preserveAspectRatio="none" className="mt-0.5 h-[6px] w-full text-[var(--color-accent)]" aria-hidden="true">
        <path
          d="M2 6 C 24 11, 42 1, 63 6 C 84 11, 100 2, 118 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
