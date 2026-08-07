import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ForbiddenError } from "../utils/AppError.js";
import * as organizationService from "../services/organizationService.js";

const router = Router();

const updateOrgSchema = z.object({
  bannerUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  logoUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  websiteUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
});

const listOrgsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  search: z.string().trim().max(200).optional(),
  cause: z.string().trim().max(60).optional(),
});

router.get(
  "/",
  validateQuery(listOrgsQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, search, cause } = req.query as unknown as z.infer<typeof listOrgsQuerySchema>;
    const [result, causes] = await Promise.all([
      organizationService.listPublicOrganizations({ page, limit, search, cause }),
      organizationService.listCauses(),
    ]);
    res.json({ ...result, causes });
  }),
);

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

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    res.json({ organization: await organizationService.getPublicOrganization(req.params.slug) });
  }),
);

export default router;
