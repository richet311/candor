import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { recordAuditEvent } from "../services/auditService.js";
import { AuditAction } from "../types/audit.js";
import { ForbiddenError, NotFoundError } from "../utils/AppError.js";

const router = Router();

const createFundUpdateSchema = z.object({
  fundId: z.string().uuid(),
  body: z.string().trim().min(3).max(2000),
});

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(createFundUpdateSchema),
  asyncHandler(async (req, res) => {
    const fund = await prisma.fund.findUnique({ where: { id: req.body.fundId } });
    if (!fund) throw new NotFoundError("Fund not found");
    if (fund.organizationId !== req.user!.organizationId) {
      throw new ForbiddenError("You can only post updates for your own organization's funds");
    }

    const update = await prisma.fundUpdate.create({
      data: { fundId: fund.id, authorUserId: req.user!.sub, body: req.body.body },
    });

    await recordAuditEvent({
      actorUserId: req.user!.sub,
      action: AuditAction.FUND_UPDATE_POSTED,
      targetType: "Fund",
      targetId: fund.id,
      metadata: { fundName: fund.name },
      ipAddress: req.ip,
    });

    res.status(201).json({ update });
  }),
);

export default router;
