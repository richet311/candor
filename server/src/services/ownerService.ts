import { prisma } from "../lib/prisma.js";
import { recordAuditEvent } from "./auditService.js";
import { AuditAction } from "../types/audit.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../utils/AppError.js";
import type { Role } from "../../generated/client/index.js";

interface ActorMeta {
  id: string;
  ipAddress?: string | null;
}

export async function getPlatformStats() {
  const [userCounts, organizationCount, fundCounts, donationAgg, expenseAgg] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.organization.count(),
    prisma.fund.groupBy({ by: ["isActive"], _count: { _all: true } }),
    prisma.donation.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amountCents: true }, _count: { _all: true } }),
    prisma.expense.aggregate({ _sum: { amountCents: true } }),
  ]);

  const usersByRole = Object.fromEntries(userCounts.map((row) => [row.role, row._count._all])) as Record<string, number>;
  const activeFunds = fundCounts.find((row) => row.isActive)?._count._all ?? 0;
  const inactiveFunds = fundCounts.find((row) => !row.isActive)?._count._all ?? 0;

  return {
    totalUsers: userCounts.reduce((sum, row) => sum + row._count._all, 0),
    usersByRole: { ADMIN: usersByRole.ADMIN ?? 0, DONOR: usersByRole.DONOR ?? 0, OWNER: usersByRole.OWNER ?? 0 },
    totalOrganizations: organizationCount,
    activeFunds,
    inactiveFunds,
    totalDonations: donationAgg._count._all,
    totalDonationVolumeCents: donationAgg._sum.amountCents ?? 0,
    totalExpensesCents: expenseAgg._sum.amountCents ?? 0,
  };
}

export async function listUsers(params: { page: number; limit: number; search?: string; role?: Role }) {
  const { page, limit, search, role } = params;
  const where = {
    ...(search
      ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] }
      : {}),
    ...(role ? { role } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { organization: { select: { name: true, slug: true } }, _count: { select: { donations: true, expenses: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      emailVerified: u.emailVerified,
      isDemoDonor: u.isDemoDonor,
      organization: u.organization,
      donationCount: u._count.donations,
      expenseCount: u._count.expenses,
      createdAt: u.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function listOrganizations(params: { page: number; limit: number; search?: string }) {
  const { page, limit, search } = params;
  const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { funds: true, members: true } } },
    }),
    prisma.organization.count({ where }),
  ]);

  return {
    organizations: organizations.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      verified: o.verified,
      ein: o.ein,
      fundCount: o._count.funds,
      memberCount: o._count.members,
      createdAt: o.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function listFunds(params: { page: number; limit: number; search?: string }) {
  const { page, limit, search } = params;
  const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};

  const [funds, total] = await Promise.all([
    prisma.fund.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        organization: { select: { name: true, slug: true } },
        donations: { where: { status: "SUCCEEDED" }, select: { amountCents: true } },
        _count: { select: { donations: true, expenses: true } },
      },
    }),
    prisma.fund.count({ where }),
  ]);

  return {
    funds: funds.map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      category: f.category,
      isActive: f.isActive,
      organization: f.organization,
      raisedCents: f.donations.reduce((sum, d) => sum + d.amountCents, 0),
      donationCount: f._count.donations,
      expenseCount: f._count.expenses,
      createdAt: f.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// Every delete below deliberately refuses to touch anything with real donation history.
// The whole premise of this app is an honest, permanent ledger. Cleaning up test data
// should never be able to silently make a fund's "raised" total wrong. Prisma Studio is
// still available as an unguarded escape hatch for the rare real exception.

export async function deleteUser(userId: string, actor: ActorMeta) {
  if (userId === actor.id) throw new ForbiddenError("You can't delete your own account from here");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { donations: true, expenses: true } } },
  });
  if (!user) throw new NotFoundError("User not found");

  if (user._count.donations > 0) {
    throw new ConflictError(`This account has ${user._count.donations} donation(s) on the public ledger and can't be deleted here.`);
  }
  if (user._count.expenses > 0) {
    throw new ConflictError(`This account logged ${user._count.expenses} expense(s) against a fund and can't be deleted here.`);
  }

  await prisma.auditLog.deleteMany({ where: { actorUserId: userId } });
  await prisma.user.delete({ where: { id: userId } });

  await recordAuditEvent({
    actorUserId: actor.id,
    action: AuditAction.OWNER_DELETED_USER,
    targetType: "User",
    targetId: userId,
    metadata: { email: user.email, role: user.role },
    ipAddress: actor.ipAddress,
  });
}

export async function deleteOrganization(orgId: string, actor: ActorMeta) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { members: { select: { id: true } }, funds: { select: { name: true, _count: { select: { donations: true } } } } },
  });
  if (!org) throw new NotFoundError("Organization not found");

  const fundsWithDonations = org.funds.filter((f) => f._count.donations > 0);
  if (fundsWithDonations.length > 0) {
    throw new ConflictError(
      `This organization has real donation history on ${fundsWithDonations.map((f) => f.name).join(", ")} and can't be deleted here.`,
    );
  }
  if (org.members.length > 0) {
    throw new ConflictError(`This organization still has ${org.members.length} staff account(s). Delete those first.`);
  }

  // No donations exist on any of its funds, so cascading the funds (and their expenses) away
  // doesn't erase anything that was ever part of a public "raised" total.
  await prisma.organization.delete({ where: { id: orgId } });

  await recordAuditEvent({
    actorUserId: actor.id,
    action: AuditAction.OWNER_DELETED_ORGANIZATION,
    targetType: "Organization",
    targetId: orgId,
    metadata: { name: org.name, fundCount: org.funds.length },
    ipAddress: actor.ipAddress,
  });
}

export async function deleteFund(fundId: string, actor: ActorMeta) {
  const fund = await prisma.fund.findUnique({ where: { id: fundId }, include: { _count: { select: { donations: true } } } });
  if (!fund) throw new NotFoundError("Fund not found");

  if (fund._count.donations > 0) {
    throw new ConflictError(`This fund has ${fund._count.donations} donation(s) on the public ledger and can't be deleted here.`);
  }

  await prisma.fund.delete({ where: { id: fundId } });

  await recordAuditEvent({
    actorUserId: actor.id,
    action: AuditAction.OWNER_DELETED_FUND,
    targetType: "Fund",
    targetId: fundId,
    metadata: { name: fund.name },
    ipAddress: actor.ipAddress,
  });
}

export async function listVerificationRequests() {
  return prisma.organization.findMany({
    where: { verificationStatus: "PENDING" },
    orderBy: { verificationRequestedAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      ein: true,
      websiteUrl: true,
      description: true,
      verificationRequestedAt: true,
    },
  });
}

export async function approveVerification(orgId: string, actor: ActorMeta) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError("Organization not found");
  if (org.verificationStatus !== "PENDING") throw new ConflictError("This organization has no pending verification request");

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: {
      verified: true,
      verificationStatus: "VERIFIED",
      // ProPublica's Nonprofit Explorer is the same public IRS-registry lookup the seed script
      // sourced these orgs from in the first place, so it doubles as citable evidence here.
      sourceUrl: org.ein ? `https://projects.propublica.org/nonprofits/organizations/${org.ein}` : org.sourceUrl,
    },
  });

  await recordAuditEvent({
    actorUserId: actor.id,
    action: AuditAction.ORG_VERIFICATION_APPROVED,
    targetType: "Organization",
    targetId: orgId,
    ipAddress: actor.ipAddress,
  });

  return updated;
}

export async function rejectVerification(orgId: string, reason: string, actor: ActorMeta) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError("Organization not found");
  if (org.verificationStatus !== "PENDING") throw new ConflictError("This organization has no pending verification request");

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: { verificationStatus: "REJECTED", verificationRejectionReason: reason },
  });

  await recordAuditEvent({
    actorUserId: actor.id,
    action: AuditAction.ORG_VERIFICATION_REJECTED,
    targetType: "Organization",
    targetId: orgId,
    metadata: { reason },
    ipAddress: actor.ipAddress,
  });

  return updated;
}
