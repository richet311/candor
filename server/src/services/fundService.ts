import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../utils/AppError.js";

export async function listPublicFunds(params: { page: number; limit: number; search?: string; category?: string }) {
  const { page, limit, search, category } = params;

  const where = {
    isActive: true,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(category ? { category } : {}),
  };

  const [funds, total, categories, donationAgg, expenseAgg] = await Promise.all([
    prisma.fund.findMany({
      where,
      include: {
        organization: { select: { name: true, slug: true, verified: true, sourceUrl: true, logoUrl: true, bannerUrl: true, websiteUrl: true } },
        donations: { where: { status: "SUCCEEDED" }, select: { amountCents: true } },
        expenses: { select: { amountCents: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.fund.count({ where }),
    prisma.fund.findMany({ where: { isActive: true }, distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
    // Platform-wide totals, independent of the current page/filter, so the landing page's
    // stats stay correct even though this endpoint itself is now paginated.
    prisma.donation.aggregate({ where: { status: "SUCCEEDED", fund: { isActive: true } }, _sum: { amountCents: true } }),
    prisma.expense.aggregate({ where: { fund: { isActive: true } }, _sum: { amountCents: true } }),
  ]);

  return {
    funds: funds.map((fund) => ({
      id: fund.id,
      slug: fund.slug,
      name: fund.name,
      description: fund.description,
      category: fund.category,
      goalCents: fund.goalCents,
      coverImageUrl: fund.coverImageUrl,
      organization: fund.organization,
      raisedCents: fund.donations.reduce((sum, d) => sum + d.amountCents, 0),
      spentCents: fund.expenses.reduce((sum, e) => sum + e.amountCents, 0),
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    categories: categories.map((c) => c.category),
    totalRaisedCents: donationAgg._sum.amountCents ?? 0,
    totalSpentCents: expenseAgg._sum.amountCents ?? 0,
  };
}

export async function getFundDetail(slug: string) {
  const fund = await prisma.fund.findUnique({
    where: { slug },
    include: {
      organization: { select: { name: true, slug: true, verified: true, sourceUrl: true, logoUrl: true, bannerUrl: true, websiteUrl: true } },
      donations: {
        where: { status: "SUCCEEDED" },
        orderBy: { createdAt: "desc" },
        select: { id: true, amountCents: true, createdAt: true, isAnonymous: true, donor: { select: { name: true, username: true, isDemoDonor: true } } },
      },
      expenses: { orderBy: { createdAt: "desc" }, select: { id: true, category: true, description: true, amountCents: true, createdAt: true } },
      updates: { orderBy: { createdAt: "desc" }, select: { id: true, body: true, createdAt: true } },
    },
  });

  if (!fund) throw new NotFoundError("Fund not found");

  const raisedCents = fund.donations.reduce((sum, d) => sum + d.amountCents, 0);
  const spentCents = fund.expenses.reduce((sum, e) => sum + e.amountCents, 0);

  const byCategory = new Map<string, number>();
  for (const expense of fund.expenses) {
    byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amountCents);
  }

  const activity = [
    ...fund.donations.map((d) => ({
      type: "donation" as const,
      id: d.id,
      amountCents: d.amountCents,
      createdAt: d.createdAt,
      isAnonymous: d.isAnonymous,
     
      donorName: d.isAnonymous || d.donor.isDemoDonor ? null : (d.donor.username ?? d.donor.name),
    })),
    ...fund.expenses.map((e) => ({ type: "expense" as const, id: e.id, amountCents: e.amountCents, category: e.category, description: e.description, createdAt: e.createdAt })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    id: fund.id,
    slug: fund.slug,
    name: fund.name,
    description: fund.description,
    category: fund.category,
    goalCents: fund.goalCents,
    coverImageUrl: fund.coverImageUrl,
    organization: fund.organization,
    raisedCents,
    spentCents,
    expensesByCategory: Array.from(byCategory.entries()).map(([category, amountCents]) => ({ category, amountCents })),
    activity: activity.slice(0, 25),
    updates: fund.updates,
  };
}

export async function listOrgFunds(organizationId: string) {
  const funds = await prisma.fund.findMany({
    where: { organizationId },
    include: {
      donations: { where: { status: "SUCCEEDED" }, select: { amountCents: true } },
      expenses: { select: { amountCents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return funds.map((fund) => ({
    id: fund.id,
    slug: fund.slug,
    name: fund.name,
    description: fund.description,
    category: fund.category,
    goalCents: fund.goalCents,
    coverImageUrl: fund.coverImageUrl,
    isActive: fund.isActive,
    raisedCents: fund.donations.reduce((sum, d) => sum + d.amountCents, 0),
    spentCents: fund.expenses.reduce((sum, e) => sum + e.amountCents, 0),
  }));
}
