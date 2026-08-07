import { Link } from "react-router-dom";
import { Card, CardBody } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";
import { VerifiedBadge } from "./VerifiedBadge";
import { OrgAvatar } from "./OrgAvatar";
import { FundCoverArt } from "./FundCoverArt";
import { formatCents } from "../lib/money";
import type { Fund } from "../lib/types";

export function FundCard({ fund }: { fund: Fund }) {
  return (
    <Link to={`/funds/${fund.slug}`}>
      <Card className="flex h-full flex-col transition-all hover:-translate-y-1 hover:shadow-xl">
        <div className="relative shrink-0">
          <FundCoverArt category={fund.category} imageUrl={fund.coverImageUrl} className="aspect-[16/10]" />
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--color-ink)] shadow-sm backdrop-blur-sm">
            {fund.category}
          </span>
        </div>

        <CardBody className="flex flex-1 flex-col gap-3">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[var(--color-ink)]">{fund.name}</h3>

          {fund.organization && (
            <div className="flex items-center gap-2">
              <OrgAvatar name={fund.organization.name} imageUrl={fund.organization.logoUrl} size="sm" />
              <p className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-soft)]">
                {fund.organization.websiteUrl ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(fund.organization!.websiteUrl!, "_blank", "noopener,noreferrer");
                    }}
                    className="hover:text-[var(--color-ink)] hover:underline"
                  >
                    {fund.organization.name}
                  </button>
                ) : (
                  fund.organization.name
                )}
                {fund.organization.verified && <VerifiedBadge />}
              </p>
            </div>
          )}

          <p className="line-clamp-2 flex-1 text-sm text-[var(--color-ink-soft)]">{fund.description}</p>

          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[var(--color-ink)]">{formatCents(fund.raisedCents)} raised</span>
            <span className="text-[var(--color-ink-soft)]">of {formatCents(fund.goalCents)}</span>
          </div>

          <ProgressBar raisedCents={fund.raisedCents} goalCents={fund.goalCents} />
        </CardBody>
      </Card>
    </Link>
  );
}
