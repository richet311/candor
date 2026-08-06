import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../utils/AppError.js";

export async function listPublicFunds() {
  const funds = await prisma.fund.findMany({
    where: { isActive: true },
    include: {
      organization: { select: { name: true, slug: true } },
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
    organization: fund.organization,
    raisedCents: fund.donations.reduce((sum, d) => sum + d.amountCents, 0),
    spentCents: fund.expenses.reduce((sum, e) => sum + e.amountCents, 0),
  }));
}

export async function getFundDetail(slug: string) {
  const fund = await prisma.fund.findUnique({
    where: { slug },
    include: {
      organization: { select: { name: true, slug: true } },
      donations: { where: { status: "SUCCEEDED" }, orderBy: { createdAt: "desc" }, select: { id: true, amountCents: true, createdAt: true } },
      expenses: { orderBy: { createdAt: "desc" }, select: { id: true, category: true, description: true, amountCents: true, createdAt: true } },
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
    ...fund.donations.map((d) => ({ type: "donation" as const, id: d.id, amountCents: d.amountCents, createdAt: d.createdAt })),
    ...fund.expenses.map((e) => ({ type: "expense" as const, id: e.id, amountCents: e.amountCents, category: e.category, description: e.description, createdAt: e.createdAt })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    id: fund.id,
    slug: fund.slug,
    name: fund.name,
    description: fund.description,
    category: fund.category,
    goalCents: fund.goalCents,
    organization: fund.organization,
    raisedCents,
    spentCents,
    expensesByCategory: Array.from(byCategory.entries()).map(([category, amountCents]) => ({ category, amountCents })),
    activity: activity.slice(0, 25),
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
    isActive: fund.isActive,
    raisedCents: fund.donations.reduce((sum, d) => sum + d.amountCents, 0),
    spentCents: fund.expenses.reduce((sum, e) => sum + e.amountCents, 0),
  }));
}
