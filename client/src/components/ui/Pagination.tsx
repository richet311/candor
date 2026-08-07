function getPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set([1, 2, totalPages - 1, totalPages, page - 1, page, page + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded-full border border-[var(--color-border)] px-3.5 py-1.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>

      {pageNumbers.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-1.5 text-sm text-[var(--color-ink-soft)]">
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
              p === page ? "bg-[var(--color-navy)] text-white" : "text-[var(--color-ink)] hover:bg-black/5"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-full border border-[var(--color-border)] px-3.5 py-1.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
