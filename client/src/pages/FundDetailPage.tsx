import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { VerifiedBadge, VerifiedCheckIcon } from "../components/VerifiedBadge";
import { OrgAvatar } from "../components/OrgAvatar";
import { FundCoverArt } from "../components/FundCoverArt";
import { CategoryBarChart } from "../components/charts/CategoryBarChart";
import { DonateModal } from "../components/DonateModal";
import { useFund } from "../hooks/useFund";
import { useAuth } from "../context/AuthContext";
import { formatCents } from "../lib/money";

export function FundDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { fund, isLoading } = useFund(slug);
  const { user, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleResend() {
    setIsResending(true);
    try {
      await resendVerificationEmail();
    } finally {
      setIsResending(false);
    }
  }

  // React Router reuses this component across slug changes (e.g. browser back/forward
  // between two fund pages) rather than remounting it, so any open modal would otherwise
  // survive onto a different fund's page.
  useEffect(() => {
    setIsDonateOpen(false);
  }, [slug]);

  // location.key is "default" when there's no in-app history to go back to
  // (e.g. a direct link or hard refresh), so fall back to the browse page instead
  // of navigating away from the app.
  function handleBack() {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/funds");
    }
  }

  if (isLoading) return <Spinner label="Loading fund" />;
  if (!fund) {
    return (
      <PageContainer>
        <EmptyState title="Fund not found" description="This fund may have been closed or the link is incorrect." />
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
        <FundCoverArt
          category={fund.category}
          imageUrl={fund.organization?.bannerUrl ?? fund.coverImageUrl}
          className="aspect-[21/6]"
        />
        <CardBody className="flex flex-col gap-4">
          {fund.organization && (
            <div className="flex items-center gap-3">
              <Link to={`/organizations/${fund.organization.slug}`}>
                <OrgAvatar name={fund.organization.name} imageUrl={fund.organization.logoUrl} size="lg" />
              </Link>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <Link to={`/organizations/${fund.organization.slug}`} className="font-semibold text-[var(--color-ink)] hover:underline">
                    {fund.organization.name}
                  </Link>
                  {fund.organization.websiteUrl && (
                    <a
                      href={fund.organization.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Visit website"
                      className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                        <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                      </svg>
                    </a>
                  )}
                  {fund.organization.verified && (
                    <a
                      href={fund.organization.sourceUrl ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      title="Verified against the IRS nonprofit registry"
                      className="text-[var(--color-success)]"
                    >
                      <VerifiedCheckIcon className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {fund.organization.verified && (
                  <a
                    href={fund.organization.sourceUrl ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="w-fit"
                  >
                    <VerifiedBadge />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col items-start gap-2">
            <Badge tone="accent">{fund.category}</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">{fund.name}</h1>
            <p className="max-w-2xl text-[15px] text-[var(--color-ink-soft)]">{fund.description}</p>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {fund.expensesByCategory.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">Where the money goes</h2>
              </CardHeader>
              <CardBody>
                <CategoryBarChart data={fund.expensesByCategory} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-[var(--color-ink)]">Activity</h2>
              {fund.organization?.verified && (
                <p className="text-xs text-[var(--color-ink-soft)]">
                  This organization's identity is verified against the IRS nonprofit registry.
                </p>
              )}
            </CardHeader>
            <CardBody>
              {fund.activity.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-soft)]">No activity logged yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-[var(--color-border)]/60">
                  {fund.activity.map((entry) => (
                    <li key={`${entry.type}-${entry.id}`} className="flex items-center justify-between py-3.5 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--color-ink)]">
                          {entry.type === "donation" ? "Donation received" : entry.description}
                        </span>
                        <span className="text-xs text-[var(--color-ink-soft)]">
                          {entry.type === "expense"
                            ? entry.category
                            : entry.donorName ?? (entry.isAnonymous ? "Anonymous donor" : "Donor contribution")}{" "}
                          · {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={entry.type === "donation" ? "font-semibold text-[var(--color-success)]" : "font-semibold text-[var(--color-ink)]"}>
                        {entry.type === "donation" ? "+" : "-"}
                        {formatCents(entry.amountCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardBody className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Raised</span>
                <span className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">{formatCents(fund.raisedCents)}</span>
                <span className="text-sm text-[var(--color-ink-soft)]">of {formatCents(fund.goalCents)} goal</span>
              </div>
              <div className="flex flex-col gap-2">
                <ProgressBar raisedCents={fund.raisedCents} goalCents={fund.goalCents} />
                <p className="text-xs text-[var(--color-ink-soft)]">{formatCents(fund.spentCents)} spent so far, itemized above</p>
              </div>
              {user && user.emailVerified && (
                <Button onClick={() => setIsDonateOpen(true)} className="w-full">
                  Donate to this fund
                </Button>
              )}
              {user && !user.emailVerified && (
                <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-black/[0.02] p-3 text-center">
                  <p className="text-xs text-[var(--color-ink-soft)]">Verify your email before you can donate.</p>
                  <Button variant="ghost" onClick={handleResend} isLoading={isResending} className="w-full">
                    Resend verification email
                  </Button>
                </div>
              )}
              {!user && (
                <Link to="/login">
                  <Button className="w-full">Log in to donate</Button>
                </Link>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {isDonateOpen && (
        <DonateModal fundId={fund.id} fundName={fund.name} fundCategory={fund.category} onClose={() => setIsDonateOpen(false)} />
      )}
    </PageContainer>
  );
}
