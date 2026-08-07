import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { ForbiddenError } from "../utils/AppError.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const organizationId = req.user!.organizationId;
    if (!organizationId) throw new ForbiddenError("No organization associated with this account");

    // Donations are acted by the donor, not org staff, so they'd never match an actor-based
    // filter. Surface them by fund ownership instead, alongside anything actually done by
    // this org's own team. auth.refresh fires automatically every ~15 minutes a session stays
    // open; it's not a meaningful action for a human reviewing activity, so it's left out here.
    const orgFunds = await prisma.fund.findMany({ where: { organizationId }, select: { id: true } });
    const fundIds = orgFunds.map((f) => f.id);

    const entries = await prisma.auditLog.findMany({
      where: {
        action: { not: "auth.refresh" },
        OR: [{ actor: { organizationId } }, { targetType: "Fund", targetId: { in: fundIds } }],
      },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json({ entries });
  }),
);

export default router;
