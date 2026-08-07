import { Link } from "react-router-dom";
import { Card, CardBody } from "./ui/Card";
import { OrgAvatar } from "./OrgAvatar";
import { VerifiedBadge } from "./VerifiedBadge";
import { formatCents } from "../lib/money";
import type { OrganizationSummary } from "../lib/types";

export function OrganizationCard({ organization }: { organization: OrganizationSummary }) {
  return (
    <Link to={`/organizations/${organization.slug}`}>
      <Card className="flex h-full flex-col transition-all hover:-translate-y-1 hover:shadow-xl">
        {organization.bannerUrl ? (
          <img src={organization.bannerUrl} alt="" className="aspect-[16/6] w-full object-cover" />
        ) : (
          <div className="aspect-[16/6] w-full bg-gradient-to-br from-[var(--color-navy)]/10 to-[var(--color-accent)]/10" />
        )}

        <CardBody className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-3">
            <OrgAvatar name={organization.name} imageUrl={organization.logoUrl} size="lg" />
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-base font-semibold text-[var(--color-ink)]">{organization.name}</h3>
                {organization.verified && <VerifiedBadge />}
              </div>
            </div>
          </div>

          <p className="line-clamp-2 text-sm text-[var(--color-ink-soft)]">
            {organization.description ?? "This organization hasn't added a description yet."}
          </p>

          {organization.causes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {organization.causes.map((cause) => (
                <span key={cause} className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-[var(--color-ink-soft)]">
                  {cause}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)]/60 pt-3 text-sm">
            <span className="text-[var(--color-ink-soft)]">
              {organization.fundCount} active {organization.fundCount === 1 ? "fund" : "funds"}
            </span>
            <span className="font-semibold text-[var(--color-ink)]">{formatCents(organization.raisedCents)} raised</span>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
