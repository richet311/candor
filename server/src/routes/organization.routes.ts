import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ForbiddenError } from "../utils/AppError.js";
import * as organizationService from "../services/organizationService.js";

const router = Router();

const updateOrgSchema = z.object({
  bannerUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  logoUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  websiteUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
});

router.get(
  "/me",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    if (!req.user!.organizationId) throw new ForbiddenError("No organization associated with this account");
    res.json({ organization: await organizationService.getMyOrganization(req.user!.organizationId) });
  }),
);

router.patch(
  "/me",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(updateOrgSchema),
  asyncHandler(async (req, res) => {
    if (!req.user!.organizationId) throw new ForbiddenError("No organization associated with this account");

    const organization = await organizationService.updateOrgProfile(
      req.user!.organizationId,
      {
        bannerUrl: req.body.bannerUrl === undefined ? undefined : req.body.bannerUrl || null,
        logoUrl: req.body.logoUrl === undefined ? undefined : req.body.logoUrl || null,
        websiteUrl: req.body.websiteUrl === undefined ? undefined : req.body.websiteUrl || null,
      },
      { ipAddress: req.ip, actorUserId: req.user!.sub },
    );

    res.json({ organization });
  }),
);

export default router;
