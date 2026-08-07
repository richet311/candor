import { useEffect, useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { FundCard } from "../components/FundCard";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { useFunds } from "../hooks/useFunds";

const LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 300;

export function BrowseFundsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, category]);

  const { funds, total, totalPages, categories, isLoading } = useFunds({ page, limit: LIMIT, search, category });

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">Active funds</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">Every fund below has a public, itemized ledger.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="6.5" />
            <path strokeLinecap="round" d="M18 18l-4-4" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search funds by name"
            aria-label="Search funds by name"
            className="w-full rounded-full border border-[var(--color-border)] py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--color-navy)] focus:ring-2 focus:ring-[var(--color-navy)]/10"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === ""
                  ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
                  : "border-[var(--color-border)] text-[var(--color-ink-soft)] hover:border-[var(--color-navy)]/40"
              }`}
            >
              All categories
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  category === c
                    ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
                    : "border-[var(--color-border)] text-[var(--color-ink-soft)] hover:border-[var(--color-navy)]/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && <Spinner label="Loading funds" />}

      {!isLoading && funds.length === 0 && (
        <EmptyState
          title="No funds found"
          description={
            search || category ? "Try a different search term or clear the category filter." : "Nonprofits that register with Candor will show up here once they open a fund."
          }
        />
      )}

      {!isLoading && funds.length > 0 && (
        <>
          <p className="text-xs text-[var(--color-ink-soft)]">
            {total} fund{total === 1 ? "" : "s"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {funds.map((fund) => (
              <FundCard key={fund.id} fund={fund} />
            ))}
          </div>
          <div className="pt-4">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </>
      )}
    </PageContainer>
  );
}
