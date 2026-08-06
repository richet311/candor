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

const createExpenseSchema = z.object({
  fundId: z.string().uuid(),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(3).max(500),
  amountCents: z.number().int().positive().max(1_000_000_00),
});

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(createExpenseSchema),
  asyncHandler(async (req, res) => {
    const fund = await prisma.fund.findUnique({ where: { id: req.body.fundId } });
    if (!fund) throw new NotFoundError("Fund not found");
    if (fund.organizationId !== req.user!.organizationId) {
      throw new ForbiddenError("You can only log expenses for your own organization's funds");
    }

    const expense = await prisma.expense.create({
      data: { ...req.body, createdByUserId: req.user!.sub },
    });

    await recordAuditEvent({
      actorUserId: req.user!.sub,
      action: AuditAction.EXPENSE_LOGGED,
      targetType: "Expense",
      targetId: expense.id,
      metadata: { fundId: fund.id, amountCents: expense.amountCents, category: expense.category },
      ipAddress: req.ip,
    });

    res.status(201).json({ expense });
  }),
);

export default router;
