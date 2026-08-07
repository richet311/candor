import { Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { StatTile } from "../components/ui/StatTile";
import { FundCard } from "../components/FundCard";
import { Spinner } from "../components/ui/Spinner";
import { RecentDonationsTicker } from "../components/RecentDonationsTicker";
import { VerifiedCheckIcon } from "../components/VerifiedBadge";
import { useFunds } from "../hooks/useFunds";
import { useFund } from "../hooks/useFund";
import { formatCents } from "../lib/money";
import { getPresetAmountsCents } from "../lib/donationPresets";

const PATHS = [
  {
    title: "I want to give",
    body: "Browse verified nonprofits, see exactly where a fund's money has gone so far, and donate in a few clicks.",
    cta: "Browse funds",
    to: "/funds",
  },
  {
    title: "I run a nonprofit",
    body: "Open a fund, log expenses as they happen, and let donors see the ledger before they give.",
    cta: "Register your organization",
    to: "/register",
  },
];

const STEPS = [
  {
    title: "A nonprofit opens a fund",
    body: "Staff set a goal, describe the need, and start logging every expense against it as it happens.",
  },
  {
    title: "Donors see the ledger, not just a thermometer",
    body: "Every dollar raised and every dollar spent is broken down by category, in the order it happened.",
  },
  {
    title: "Giving is a few clicks, backed by Stripe",
    body: "Card payments are processed by Stripe. Candor never touches or stores card details.",
  },
];

export function LandingPage() {
  const { funds, total, categories, totalRaisedCents, totalSpentCents, isLoading } = useFunds();
  const previewFund = funds[0];
  const { fund: previewFundDetail } = useFund(previewFund?.slug);
  const previewPresetAmountsCents = getPresetAmountsCents(previewFund?.category);
  const topCategories = [...(previewFundDetail?.expensesByCategory ?? [])]
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, 2);

  return (
    <div>
      <RecentDonationsTicker />

      <section className="relative overflow-hidden bg-[var(--color-navy-dark)] pb-16 sm:pb-24">
        <PageContainer className="grid gap-12 py-20 text-white sm:py-28 lg:grid-cols-[1fr_400px] lg:items-center">
          <div className="flex flex-col items-start gap-6">
            <h1 className="max-w-2xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Show donors <span className="text-[var(--color-accent)]">exactly where their money went.</span>
            </h1>
            <p className="max-w-xl text-lg text-white/80">
              Candor replaces the vague progress bar with an open ledger: every donation in, every expense out,
              organized by fund and category, visible to anyone before they give.
            </p>
            <div className="flex gap-3">
              <Link to="/funds">
                <Button variant="secondary">Browse funds</Button>
              </Link>
              <Link to="/register">
                <Button variant="ghost" className="border-white/30 text-white hover:bg-white/10">
                  Register a nonprofit
                </Button>
              </Link>
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((category, i) => (
                  <span
                    key={category}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
                      i === 0 ? "border-[var(--color-accent)] text-[var(--color-accent)]" : "border-white/20 text-white/70"
                    }`}
                  >
                    {i === 0 && <VerifiedCheckIcon className="h-3 w-3" />}
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>

          {previewFund && (
            <div className="relative hidden h-72 lg:block">
              <div className="absolute right-0 top-0 w-80 rotate-2 rounded-2xl bg-[var(--color-paper-raised)] p-5 text-left shadow-2xl">
                <p className="text-xs font-semibold text-[var(--color-ink-soft)]">{previewFund.name}</p>
                <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{formatCents(previewFund.raisedCents)}</p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)]"
                    style={{ width: `${previewFund.goalCents > 0 ? Math.min(100, (previewFund.raisedCents / previewFund.goalCents) * 100) : 0}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-4 gap-1.5">
                  {previewPresetAmountsCents.map((amountCents) => (
                    <span
                      key={amountCents}
                      className="rounded-lg border border-[var(--color-border)] py-1.5 text-center text-xs font-semibold text-[var(--color-ink)]"
                    >
                      ${amountCents / 100}
                    </span>
                  ))}
                </div>
              </div>
              {topCategories.length > 0 && (
                <div className="absolute bottom-0 left-0 w-52 -rotate-3 rounded-2xl bg-[var(--color-paper-raised)] p-4 text-left shadow-2xl">
                  <p className="text-xs font-semibold text-[var(--color-ink-soft)]">Where the money goes</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {topCategories.map((c) => (
                      <li key={c.category} className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-ink)]">{c.category}</span>
                        <span className="font-semibold text-[var(--color-ink)]">{formatCents(c.amountCents)}</span>
                      </li>
                    ))}
                    <li className="flex items-center justify-between border-t border-[var(--color-border)]/60 pt-1.5 text-xs">
                      <span className="text-[var(--color-success)]">Raised so far</span>
                      <span className="font-semibold text-[var(--color-success)]">{formatCents(previewFund.raisedCents)}</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </PageContainer>

        <svg
          className="absolute inset-x-0 bottom-0 h-16 w-full text-[var(--color-paper)] sm:h-28"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,20 C280,140 1160,140 1440,20 L1440,140 L0,140 Z" fill="currentColor" />
        </svg>
      </section>

      <PageContainer className="-mt-8 grid gap-4 pb-4 sm:-mt-10 sm:grid-cols-3 sm:gap-5">
        <StatTile label="Active funds" value={isLoading ? "…" : String(total)} />
        <StatTile label="Raised so far" value={isLoading ? "…" : formatCents(totalRaisedCents)} />
        <StatTile label="Itemized and spent" value={isLoading ? "…" : formatCents(totalSpentCents)} hint="Every dollar logged by category" />
      </PageContainer>

      <PageContainer className="grid gap-5 py-8 sm:grid-cols-2">
        {PATHS.map((path) => (
          <Link key={path.title} to={path.to} className="group">
            <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <CardBody className="flex h-full flex-col gap-2">
                <h3 className="text-lg font-bold text-[var(--color-ink)]">{path.title}</h3>
                <p className="flex-1 text-sm text-[var(--color-ink-soft)]">{path.body}</p>
                <span className="text-sm font-semibold text-[var(--color-accent)] group-hover:text-[var(--color-accent-dark)]">
                  {path.cta} &rarr;
                </span>
              </CardBody>
            </Card>
          </Link>
        ))}
      </PageContainer>

      {!isLoading && funds.length > 0 && (
        <PageContainer className="flex flex-col gap-6 py-16">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">Funds you can support today</h2>
            <Link to="/funds" className="text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-dark)]">
              See all funds &rarr;
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {funds.slice(0, 3).map((fund) => (
              <FundCard key={fund.id} fund={fund} />
            ))}
          </div>
        </PageContainer>
      )}

      {isLoading && (
        <PageContainer className="py-16">
          <Spinner label="Loading funds" />
        </PageContainer>
      )}

      <PageContainer className="flex flex-col gap-8 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">How it works</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="transition-shadow hover:shadow-lg">
              <CardBody className="flex flex-col gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-sm font-bold text-[var(--color-accent)]">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-[var(--color-ink)]">{step.title}</h3>
                <p className="text-sm text-[var(--color-ink-soft)]">{step.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy-dark)] px-6 py-10 shadow-[0_1px_2px_rgba(18,32,58,0.04),0_12px_28px_-10px_rgba(18,32,58,0.12)] sm:px-10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="0.75"
            className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 text-white opacity-[0.06]"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 5L5 19M8 6a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>

          <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
            <div className="flex flex-col items-center text-center text-white sm:items-end sm:text-right">
              <span className="text-6xl font-bold tracking-tight text-[var(--color-accent)] sm:text-7xl">100%</span>
              <span className="mt-1 text-sm text-white/70">of your donation reaches the fund</span>
            </div>

            <div className="hidden h-20 w-px bg-white/15 sm:block" />
            <div className="h-px w-24 bg-white/15 sm:hidden" />

            <div className="flex w-full max-w-[240px] flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Your donation</span>
                <span className="font-semibold text-white">$100</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Candor's platform fee</span>
                <span className="font-semibold text-[var(--color-accent)]">$0</span>
              </div>
              <p className="mt-2 border-t border-white/15 pt-2 text-xs text-white/50">
                Stripe's standard processing fee still applies, same as any online checkout. Candor just never adds
                its own on top.
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
