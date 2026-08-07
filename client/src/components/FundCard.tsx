import { Link } from "react-router-dom";
import { Card, CardBody } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";
import { VerifiedBadge } from "./VerifiedBadge";
import { OrgAvatar } from "./OrgAvatar";
import { formatCents } from "../lib/money";
import type { Fund } from "../lib/types";

export function FundCard({ fund }: { fund: Fund }) {
  return (
    <Link to={`/funds/${fund.slug}`}>
      <Card className="flex h-full flex-col transition-all hover:-translate-y-1 hover:shadow-xl">
        <CardBody className="flex flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[var(--color-ink)]">{fund.name}</h3>
            <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-[var(--color-ink-soft)]">{fund.category}</span>
          </div>

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
