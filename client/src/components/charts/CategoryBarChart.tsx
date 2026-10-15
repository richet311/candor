import { lazy, Suspense } from "react";
import type { ExpenseCategoryTotal } from "../../lib/types";

// Recharts is only drawn on the fund and impact pages, so it's split out of the main bundle
// and fetched the first time a chart actually renders, instead of on every page load.
const CategoryBarChartImpl = lazy(() => import("./CategoryBarChartImpl").then((m) => ({ default: m.CategoryBarChartImpl })));

export function CategoryBarChart({ data }: { data: ExpenseCategoryTotal[] }) {
  const sorted = [...data].sort((a, b) => b.amountCents - a.amountCents);
  const height = Math.max(160, sorted.length * 44);

  // The fallback holds the chart's exact height, so the cards below don't jump once it loads.
  return (
    <Suspense fallback={<div style={{ height }} />}>
      <CategoryBarChartImpl data={sorted} height={height} />
    </Suspense>
  );
}
