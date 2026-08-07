import { useEffect, useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { OrganizationCard } from "../components/OrganizationCard";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { useOrganizations } from "../hooks/useOrganizations";

const LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 300;

export function OrganizationsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cause, setCause] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, cause]);

  const { organizations, total, totalPages, causes, isLoading } = useOrganizations({ page, limit: LIMIT, search, cause });

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">Nonprofits on Candor</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">Every registered organization, whether or not they've opened a fund yet.</p>
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
            placeholder="Search organizations by name"
            aria-label="Search organizations by name"
            className="w-full rounded-full border border-[var(--color-border)] py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--color-navy)] focus:ring-2 focus:ring-[var(--color-navy)]/10"
          />
        </div>

        {causes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCause("")}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                cause === ""
                  ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
                  : "border-[var(--color-border)] text-[var(--color-ink-soft)] hover:border-[var(--color-navy)]/40"
              }`}
            >
              All causes
            </button>
            {causes.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCause(c)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  cause === c
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

      {isLoading && <Spinner label="Loading organizations" />}

      {!isLoading && organizations.length === 0 && (
        <EmptyState
          title="No organizations found"
          description={
            search || cause ? "Try a different search term or clear the cause filter." : "Nonprofits that register with Candor will show up here."
          }
        />
      )}

      {!isLoading && organizations.length > 0 && (
        <>
          <p className="text-xs text-[var(--color-ink-soft)]">
            {total} organization{total === 1 ? "" : "s"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <OrganizationCard key={org.id} organization={org} />
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
