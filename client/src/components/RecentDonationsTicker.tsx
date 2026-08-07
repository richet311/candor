import { Link } from "react-router-dom";
import { useRecentDonations } from "../hooks/useRecentDonations";
import { formatCents } from "../lib/money";
import { timeAgo } from "../lib/relativeTime";
import type { RecentDonation } from "../lib/types";

function TickerPill({ donation, ariaHidden }: { donation: RecentDonation; ariaHidden?: boolean }) {
  return (
    <Link
      to={`/funds/${donation.fund.slug}`}
      tabIndex={ariaHidden ? -1 : undefined}
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/15"
    >
      <span className="font-semibold text-[var(--color-accent)]">{formatCents(donation.amountCents)}</span>
      <span className="text-white/80">
        {donation.donorName ? `from ${donation.donorName} to` : "to"} {donation.fund.name}
      </span>
      <span className="text-white/40">· {timeAgo(donation.createdAt)}</span>
    </Link>
  );
}

export function RecentDonationsTicker() {
  const donations = useRecentDonations();

  if (donations.length === 0) return null;

  return (
    <div className="border-b border-[var(--color-border)]/60 bg-[var(--color-navy)]">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2.5">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-white/60">Just in</span>
        <div className="ticker-viewport min-w-0 flex-1 overflow-hidden">
          <div className="ticker-track flex items-center gap-3">
            {donations.map((d) => (
              <TickerPill key={d.id} donation={d} />
            ))}
            {donations.map((d) => (
              <TickerPill key={`dup-${d.id}`} donation={d} ariaHidden />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
