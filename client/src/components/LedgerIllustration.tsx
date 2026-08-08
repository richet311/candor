export function LedgerIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 260" fill="none" className={className} aria-hidden="true">
      <path
        d="M28 12 H172 A8 8 0 0 1 180 20 V224 L164 236 L148 224 L132 236 L116 224 L100 236 L84 224 L68 236 L52 224 L36 236 L20 224 V20 A8 8 0 0 1 28 12 Z"
        fill="var(--color-navy-dark)"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <path d="M42 46 H150" stroke="white" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />

      {[
        { y: 78, w: 108 },
        { y: 100, w: 84 },
        { y: 122, w: 96 },
      ].map((line) => (
        <g key={line.y}>
          <path d={`M42 ${line.y} H${42 + line.w}`} stroke="white" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
          <path d={`M158 ${line.y} H176`} stroke="white" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}

      <path d="M42 154 H176" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="1 6" strokeLinecap="round" />

      <g>
        <path d="M42 180 H128" stroke="var(--color-accent)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="165" cy="180" r="14" fill="var(--color-accent)" />
        <path d="M159 180 l4 4 l9 -9" stroke="var(--color-navy-dark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
