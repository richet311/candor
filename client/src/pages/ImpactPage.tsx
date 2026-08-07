import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { CategoryBarChart } from "../components/charts/CategoryBarChart";
import { apiFetch, ApiError } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { formatCents } from "../lib/money";
import type { PlatformImpactStats } from "../lib/types";

export function ImpactPage() {
  const [stats, setStats] = useState<PlatformImpactStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiFetch<PlatformImpactStats>("/stats/impact");
        if (!cancelled) setStats(data);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Could not load platform impact stats";
        toast.error(message, err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // toast omitted from deps, see useToast for why
  }, []);

  if (isLoading) return <Spinner label="Loading impact stats" />;
  if (!stats) return null;

  return (
    <PageContainer className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">Candor's impact so far</h1>
        <p className="max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Every number below is a live total across every organization and fund on Candor, not a snapshot. Donation
          activity is a mix of real gifts and simulated activity used to demonstrate the ledger.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Raised" value={formatCents(stats.totalRaisedCents)} hint={`${stats.totalDonationCount} donations`} />
        <StatTile label="Spent, itemized" value={formatCents(stats.totalSpentCents)} hint="Every dollar logged by category" />
        <StatTile label="Nonprofits" value={String(stats.organizationCount)} />
        <StatTile label="Active funds" value={String(stats.fundCount)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Raised by cause</h2>
          </CardHeader>
          <CardBody>
            {stats.byCategory.every((c) => c.amountCents === 0) ? (
              <p className="text-sm text-[var(--color-ink-soft)]">No donations recorded yet.</p>
            ) : (
              <CategoryBarChart data={stats.byCategory.filter((c) => c.amountCents > 0)} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Top funds</h2>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            {stats.topFunds.length === 0 || stats.topFunds.every((f) => f.raisedCents === 0) ? (
              <p className="text-sm text-[var(--color-ink-soft)]">No donations recorded yet.</p>
            ) : (
              stats.topFunds
                .filter((f) => f.raisedCents > 0)
                .map((fund, i) => (
                  <Link key={fund.id} to={`/funds/${fund.slug}`} className="flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)]/10 text-xs font-bold text-[var(--color-navy)]">
                        {i + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[var(--color-ink)] group-hover:underline">{fund.name}</span>
                        <span className="text-xs text-[var(--color-ink-soft)]">{fund.organizationName}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[var(--color-ink)]">{formatCents(fund.raisedCents)}</span>
                  </Link>
                ))
            )}
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</span>
        <span className="text-2xl font-bold text-[var(--color-ink)]">{value}</span>
        {hint && <span className="text-xs text-[var(--color-ink-soft)]">{hint}</span>}
      </CardBody>
    </Card>
  );
}
