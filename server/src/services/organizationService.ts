import { prisma } from "../lib/prisma.js";
import { recordAuditEvent } from "./auditService.js";
import { AuditAction } from "../types/audit.js";
import { NotFoundError } from "../utils/AppError.js";

export async function getMyOrganization(organizationId: string) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new NotFoundError("Organization not found");
  return org;
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
