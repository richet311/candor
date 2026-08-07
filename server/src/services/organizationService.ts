import { prisma } from "../lib/prisma.js";
import { recordAuditEvent } from "./auditService.js";
import { AuditAction } from "../types/audit.js";
import { ConflictError, NotFoundError } from "../utils/AppError.js";

export async function getMyOrganization(organizationId: string) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new NotFoundError("Organization not found");
  return org;
}

export async function listPublicOrganizations(params: { page: number; limit: number; search?: string; cause?: string }) {
  const { page, limit, search, cause } = params;

  const where = {
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(cause ? { funds: { some: { category: cause, isActive: true } } } : {}),
  };

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        funds: {
          where: { isActive: true },
          select: { category: true, donations: { where: { status: "SUCCEEDED" }, select: { amountCents: true } } },
        },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  return {
    organizations: organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logoUrl: org.logoUrl,
      bannerUrl: org.bannerUrl,
      websiteUrl: org.websiteUrl,
      verified: org.verified,
      sourceUrl: org.sourceUrl,
      fundCount: org.funds.length,
      raisedCents: org.funds.reduce((sum, f) => sum + f.donations.reduce((s, d) => s + d.amountCents, 0), 0),
      causes: Array.from(new Set(org.funds.map((f) => f.category))),
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// Only funds still open are worth surfacing as a browsable "cause" - a category whose
// only fund got closed out shouldn't linger in the filter list.
export async function listCauses() {
  const rows = await prisma.fund.findMany({
    where: { isActive: true },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((row) => row.category);
}

export async function getPublicOrganization(slug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug },
    include: {
      funds: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        include: {
          donations: { where: { status: "SUCCEEDED" }, select: { amountCents: true } },
          expenses: { select: { amountCents: true } },
        },
      },
    },
  });
  if (!org) throw new NotFoundError("Organization not found");

  const funds = org.funds.map((fund) => ({
    id: fund.id,
    slug: fund.slug,
    name: fund.name,
    description: fund.description,
    category: fund.category,
    goalCents: fund.goalCents,
    coverImageUrl: fund.coverImageUrl,
    raisedCents: fund.donations.reduce((sum, d) => sum + d.amountCents, 0),
    spentCents: fund.expenses.reduce((sum, e) => sum + e.amountCents, 0),
  }));

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    description: org.description,
    logoUrl: org.logoUrl,
    bannerUrl: org.bannerUrl,
    websiteUrl: org.websiteUrl,
    verified: org.verified,
    sourceUrl: org.sourceUrl,
    createdAt: org.createdAt,
    raisedCents: funds.reduce((sum, f) => sum + f.raisedCents, 0),
    funds,
  };
}

export async function requestVerification(
  organizationId: string,
  input: { ein: string },
  meta: { ipAddress?: string | null; actorUserId: string },
) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new NotFoundError("Organization not found");
  if (org.verificationStatus === "VERIFIED") throw new ConflictError("This organization is already verified");
  if (org.verificationStatus === "PENDING") throw new ConflictError("A verification request is already pending review");

  const einTaken = await prisma.organization.findUnique({ where: { ein: input.ein } });
  if (einTaken && einTaken.id !== organizationId) throw new ConflictError("This EIN is already associated with another organization");

  const updated = await prisma.organization.update({
    where: { id: organizationId },
    data: { ein: input.ein, verificationStatus: "PENDING", verificationRequestedAt: new Date(), verificationRejectionReason: null },
  });

  await recordAuditEvent({
    actorUserId: meta.actorUserId,
    action: AuditAction.ORG_VERIFICATION_REQUESTED,
    targetType: "Organization",
    targetId: organizationId,
    metadata: { ein: input.ein },
    ipAddress: meta.ipAddress,
  });

  return updated;
}

export async function updateOrgProfile(
  organizationId: string,
  input: { bannerUrl?: string | null; logoUrl?: string | null; websiteUrl?: string | null },
  meta: { ipAddress?: string | null; actorUserId: string },
) {
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { bannerUrl: input.bannerUrl, logoUrl: input.logoUrl, websiteUrl: input.websiteUrl },
  });

  await recordAuditEvent({
    actorUserId: meta.actorUserId,
    action: AuditAction.ORG_PROFILE_UPDATED,
    targetType: "Organization",
    targetId: org.id,
    ipAddress: meta.ipAddress,
  });

  return org;
}
