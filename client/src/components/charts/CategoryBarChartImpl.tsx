import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCents } from "../../lib/money";
import type { ExpenseCategoryTotal } from "../../lib/types";

// Loaded lazily through CategoryBarChart.tsx, which sorts the data and sizes the chart, so
// import that instead of this file directly.
export function CategoryBarChartImpl({ data, height }: { data: ExpenseCategoryTotal[]; height: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" tickFormatter={(v: number) => formatCents(v)} stroke="var(--color-ink-soft)" fontSize={12} />
        <YAxis type="category" dataKey="category" width={110} stroke="var(--color-ink-soft)" fontSize={12} />
        <Tooltip
          formatter={(value) => [formatCents(Number(value)), "Amount"]}
          contentStyle={{ borderRadius: 8, borderColor: "var(--color-border)", fontSize: 13 }}
        />
        <Bar dataKey="amountCents" fill="var(--color-navy)" radius={[0, 4, 4, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
