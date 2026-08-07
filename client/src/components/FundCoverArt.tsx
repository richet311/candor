const ICONS = {
  food: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 2v7a2 2 0 002 2h0a2 2 0 002-2V2M10 11v11M16 2c-1.5 1.5-2 3-2 5.5S15 12 16 12v10"
    />
  ),
  paw: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 15.5c-3 0-6 2-6 4.5 0 1.5 1.2 2 3 2s3-1 3-1 1.2 1 3 1 3-.5 3-2c0-2.5-3-4.5-6-4.5zM7 10a2 2 0 100-4 2 2 0 000 4zM12 8.5a2 2 0 100-4 2 2 0 000 4zM17 10a2 2 0 100-4 2 2 0 000 4zM19 15a2 2 0 100-4 2 2 0 000 4z"
    />
  ),
  book: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 5a2 2 0 012-2h5v18H6a2 2 0 00-2 2V5zM20 5a2 2 0 00-2-2h-5v18h5a2 2 0 002 2V5z"
    />
  ),
  users: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 2.7-5 6-5s6 2 6 5M16 8a2.5 2.5 0 110-5M17.5 12c2.5.3 4.5 2 4.5 5"
    />
  ),
  pulse: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l2-7 4 14 2-9 2 2h4" />
  ),
  shield: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2l8 3.5v6c0 5-3.4 8.7-8 10.5-4.6-1.8-8-5.5-8-10.5v-6L12 2z"
    />
  ),
  heart: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 20s-7-4.4-9.5-9C.9 7.8 2.6 4 6.3 4c2 0 3.5 1.1 4.2 2.4C11.2 5.1 12.7 4 14.7 4c3.7 0 5.4 3.8 3.8 7-2.5 4.6-9.5 9-9.5 9z"
    />
  ),
} as const;

type IconName = keyof typeof ICONS;

const CATEGORY_ICON_RULES: Array<{ match: RegExp; icon: IconName }> = [
  { match: /hunger|food|meal|nutrition/i, icon: "food" },
  { match: /animal|pet|wildlife/i, icon: "paw" },
  { match: /education|school|classroom|tutor|literacy/i, icon: "book" },
  { match: /youth|mentor|family|community/i, icon: "users" },
  { match: /mental|crisis|health|medical|recovery/i, icon: "pulse" },
  { match: /disaster|relief|emergency|safety/i, icon: "shield" },
];

const GRADIENTS = [
  "bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy-dark)]",
  "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dark)]",
  "bg-gradient-to-br from-[var(--color-success)] to-[var(--color-navy-dark)]",
  "bg-gradient-to-tr from-[var(--color-navy-dark)] to-[var(--color-navy)]",
  "bg-gradient-to-tr from-[var(--color-accent-dark)] to-[var(--color-accent)]",
  "bg-gradient-to-tr from-[var(--color-navy)] to-[var(--color-success)]",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function iconForCategory(category: string): IconName {
  const rule = CATEGORY_ICON_RULES.find((r) => r.match.test(category));
  return rule?.icon ?? "heart";
}

export function FundCoverArt({
  category,
  imageUrl,
  className = "",
}: {
  category: string;
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <div className={`relative w-full overflow-hidden bg-[var(--color-navy)] ${className}`}>
        <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }

  const gradient = GRADIENTS[hashString(category) % GRADIENTS.length];
  const icon = iconForCategory(category);

  return (
    <div className={`relative w-full overflow-hidden ${gradient} ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1"
        className="absolute -bottom-3 -right-3 h-24 w-24 text-white opacity-[0.18]"
        aria-hidden="true"
      >
        {ICONS[icon]}
      </svg>
      <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" className="h-4 w-4">
          {ICONS[icon]}
        </svg>
      </span>
    </div>
  );
}
