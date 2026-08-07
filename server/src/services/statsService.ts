import { prisma } from "../lib/prisma.js";

export async function getPlatformImpactStats() {
  const [organizationCount, fundCount, donationAgg, expenseAgg, funds] = await Promise.all([
    prisma.organization.count(),
    prisma.fund.count({ where: { isActive: true } }),
    prisma.donation.aggregate({ where: { status: "SUCCEEDED", fund: { isActive: true } }, _sum: { amountCents: true }, _count: { _all: true } }),
    prisma.expense.aggregate({ where: { fund: { isActive: true } }, _sum: { amountCents: true } }),
    prisma.fund.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        organization: { select: { name: true } },
        donations: { where: { status: "SUCCEEDED" }, select: { amountCents: true } },
      },
    }),
  ]);

  const fundsWithRaised = funds.map((fund) => ({
    ...fund,
    raisedCents: fund.donations.reduce((sum, d) => sum + d.amountCents, 0),
  }));

  const byCategory = new Map<string, number>();
  for (const fund of fundsWithRaised) {
    byCategory.set(fund.category, (byCategory.get(fund.category) ?? 0) + fund.raisedCents);
  }

  const topFunds = [...fundsWithRaised]
    .sort((a, b) => b.raisedCents - a.raisedCents)
    .slice(0, 5)
    .map((f) => ({ id: f.id, slug: f.slug, name: f.name, organizationName: f.organization.name, raisedCents: f.raisedCents }));

  return {
    organizationCount,
    fundCount,
    totalRaisedCents: donationAgg._sum.amountCents ?? 0,
    totalDonationCount: donationAgg._count._all,
    totalSpentCents: expenseAgg._sum.amountCents ?? 0,
    byCategory: Array.from(byCategory.entries())
      .map(([category, amountCents]) => ({ category, amountCents }))
      .sort((a, b) => b.amountCents - a.amountCents),
    topFunds,
  };
}
