import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { StatTile } from "../components/ui/StatTile";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { CategoryBarChart } from "../components/charts/CategoryBarChart";
import { DonateModal } from "../components/DonateModal";
import { useFund } from "../hooks/useFund";
import { useAuth } from "../context/AuthContext";
import { formatCents } from "../lib/money";

export function FundDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { fund, isLoading, reload } = useFund(slug);
  const { user } = useAuth();
  const [isDonateOpen, setIsDonateOpen] = useState(false);

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
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge tone="accent">{fund.category}</Badge>
          {fund.organization && <span className="text-sm text-[var(--color-ink-soft)]">{fund.organization.name}</span>}
        </div>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">{fund.name}</h1>
        <p className="max-w-2xl text-sm text-[var(--color-ink-soft)]">{fund.description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Raised" value={formatCents(fund.raisedCents)} />
        <StatTile label="Spent" value={formatCents(fund.spentCents)} />
        <StatTile label="Goal" value={formatCents(fund.goalCents)} />
      </div>

      <div className="flex flex-col gap-2 sm:max-w-md">
        <ProgressBar raisedCents={fund.raisedCents} goalCents={fund.goalCents} />
        {user ? (
          <Button onClick={() => setIsDonateOpen(true)} className="w-fit">
            Donate to this fund
          </Button>
        ) : (
          <Link to="/login">
            <Button className="w-fit">Log in to donate</Button>
          </Link>
        )}
      </div>

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
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">Activity</h2>
        </CardHeader>
        <CardBody>
          {fund.activity.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-soft)]">No activity logged yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--color-border)]">
              {fund.activity.map((entry) => (
                <li key={`${entry.type}-${entry.id}`} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-[var(--color-ink)]">
                      {entry.type === "donation" ? "Donation received" : entry.description}
                    </span>
                    <span className="text-xs text-[var(--color-ink-soft)]">
                      {entry.type === "expense" ? entry.category : "Donor contribution"} ·{" "}
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={entry.type === "donation" ? "font-medium text-[var(--color-success)]" : "font-medium text-[var(--color-ink)]"}>
                    {entry.type === "donation" ? "+" : "-"}
                    {formatCents(entry.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {isDonateOpen && (
        <DonateModal
          fundId={fund.id}
          fundName={fund.name}
          onClose={() => {
            setIsDonateOpen(false);
            void reload();
          }}
        />
      )}
    </PageContainer>
  );
}
