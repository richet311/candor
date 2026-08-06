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
    if (!req.user!.organizationId) throw new ForbiddenError("No organization associated with this account");

    const entries = await prisma.auditLog.findMany({
      where: { actor: { organizationId: req.user!.organizationId } },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json({ entries });
  }),
);

export default router;
