import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { recordAuditEvent } from "../services/auditService.js";
import { AuditAction } from "../types/audit.js";
import { ForbiddenError } from "../utils/AppError.js";
import * as fundService from "../services/fundService.js";

const router = Router();

const createFundSchema = z.object({
  name: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(2000),
  category: z.string().trim().min(2).max(60),
  goalCents: z.number().int().positive().max(1_000_000_00),
  coverImageUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
});

const listFundsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(60).optional(),
});

router.get(
  "/",
  validateQuery(listFundsQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await fundService.listPublicFunds(req.query as unknown as z.infer<typeof listFundsQuerySchema>));
  }),
);

router.get(
  "/mine",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    if (!req.user!.organizationId) throw new ForbiddenError("No organization associated with this account");
    res.json({ funds: await fundService.listOrgFunds(req.user!.organizationId) });
  }),
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    res.json({ fund: await fundService.getFundDetail(req.params.slug) });
  }),
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(createFundSchema),
  asyncHandler(async (req, res) => {
    if (!req.user!.organizationId) throw new ForbiddenError("No organization associated with this account");

    const slugBase = req.body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const fund = await prisma.fund.create({
      data: {
        ...req.body,
        coverImageUrl: req.body.coverImageUrl || null,
        organizationId: req.user!.organizationId,
        slug: `${slugBase}-${Date.now().toString(36)}`,
      },
    });

    await recordAuditEvent({
      actorUserId: req.user!.sub,
      action: AuditAction.FUND_CREATED,
      targetType: "Fund",
      targetId: fund.id,
      metadata: { name: fund.name, goalCents: fund.goalCents },
      ipAddress: req.ip,
    });

    res.status(201).json({ fund });
  }),
);

export default router;
