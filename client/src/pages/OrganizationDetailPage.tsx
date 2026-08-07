import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { VerifiedBadge, VerifiedCheckIcon } from "../components/VerifiedBadge";
import { OrgAvatar } from "../components/OrgAvatar";
import { FundCard } from "../components/FundCard";
import { useOrganization } from "../hooks/useOrganization";
import { formatCents } from "../lib/money";

export function OrganizationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { organization, isLoading } = useOrganization(slug);
  const navigate = useNavigate();
  const location = useLocation();

  function handleBack() {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/organizations");
    }
  }

  if (isLoading) return <Spinner label="Loading organization" />;
  if (!organization) {
    return (
      <PageContainer>
        <EmptyState title="Organization not found" description="This organization may no longer exist or the link is incorrect." />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col gap-6">
      <button
        type="button"
        onClick={handleBack}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.56l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </button>

      <Card>
        {organization.bannerUrl ? (
          <img src={organization.bannerUrl} alt="" className="aspect-[16/6] w-full object-cover" />
        ) : (
          <div className="aspect-[16/6] w-full bg-gradient-to-br from-[var(--color-navy)]/10 to-[var(--color-accent)]/10" />
        )}
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <OrgAvatar name={organization.name} imageUrl={organization.logoUrl} size="lg" />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                {organization.websiteUrl ? (
                  <a
                    href={organization.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xl font-bold text-[var(--color-ink)] hover:underline"
                  >
                    {organization.name}
                  </a>
                ) : (
                  <span className="text-xl font-bold text-[var(--color-ink)]">{organization.name}</span>
                )}
                {organization.verified && (
                  <a
                    href={organization.sourceUrl ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    title="Verified against the IRS nonprofit registry"
                    className="text-[var(--color-success)]"
                  >
                    <VerifiedCheckIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
              {organization.verified && (
                <a href={organization.sourceUrl ?? undefined} target="_blank" rel="noreferrer" className="w-fit">
                  <VerifiedBadge />
                </a>
              )}
            </div>
          </div>

          {organization.description && <p className="max-w-2xl text-[15px] text-[var(--color-ink-soft)]">{organization.description}</p>}

          <div className="flex items-center gap-6 border-t border-[var(--color-border)]/60 pt-4 text-sm">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Active funds</span>
              <span className="text-lg font-bold text-[var(--color-ink)]">{organization.funds.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Raised through Candor</span>
              <span className="text-lg font-bold text-[var(--color-ink)]">{formatCents(organization.raisedCents)}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-bold tracking-tight text-[var(--color-ink)]">Funds from {organization.name}</h2>
        {organization.funds.length === 0 ? (
          <EmptyState title="No active funds yet" description="This organization hasn't opened a fund on Candor yet. Check back soon." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {organization.funds.map((fund) => (
              <FundCard key={fund.id} fund={fund} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
