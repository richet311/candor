import { prisma } from "../lib/prisma.js";
import { createLogger } from "../lib/logger.js";
import type { AuditActionType } from "../types/audit.js";

const log = createLogger("audit");

const SECURITY_ACTIONS = new Set<AuditActionType>([
  "auth.login_failed",
  "auth.account_locked",
  "auth.refresh_reuse_detected",
  "webhook.signature_invalid",
  "security.rate_limit_exceeded",
  "security.authz_denied",
] as AuditActionType[]);

interface RecordAuditEventInput {
  actorUserId?: string | null;
  action: AuditActionType;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  const entry = await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata as never,
      ipAddress: input.ipAddress ?? null,
    },
  });

  const isSecurityEvent = SECURITY_ACTIONS.has(input.action);
  log[isSecurityEvent ? "warn" : "info"](
    { auditId: entry.id, action: input.action, actorUserId: input.actorUserId, targetType: input.targetType, targetId: input.targetId },
    isSecurityEvent ? "security event recorded" : "audit event recorded",
  );
}
