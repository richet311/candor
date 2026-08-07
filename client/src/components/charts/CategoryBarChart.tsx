import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCents } from "../../lib/money";
import type { ExpenseCategoryTotal } from "../../lib/types";

export function CategoryBarChart({ data }: { data: ExpenseCategoryTotal[] }) {
  const sorted = [...data].sort((a, b) => b.amountCents - a.amountCents);

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, sorted.length * 44)}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
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
