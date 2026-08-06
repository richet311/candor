import { PageContainer } from "../components/layout/PageContainer";
import { FundCard } from "../components/FundCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { useFunds } from "../hooks/useFunds";

export function BrowseFundsPage() {
  const { funds, isLoading } = useFunds();

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-ink)]">Active funds</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">Every fund below has a public, itemized ledger.</p>
      </div>

      {isLoading && <Spinner label="Loading funds" />}

      {!isLoading && funds.length === 0 && (
        <EmptyState title="No active funds yet" description="Nonprofits that register with Candor will show up here once they open a fund." />
      )}

      {!isLoading && funds.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {funds.map((fund) => (
            <FundCard key={fund.id} fund={fund} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
