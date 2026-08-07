import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as ownerService from "../services/ownerService.js";

const router = Router();

router.use(requireAuth, requireRole("OWNER"));

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
});

const listUsersQuerySchema = listQuerySchema.extend({
  role: z.enum(["ADMIN", "DONOR", "OWNER"]).optional(),
});

const rejectVerificationSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    res.json(await ownerService.getPlatformStats());
  }),
);

router.get(
  "/users",
  validateQuery(listUsersQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await ownerService.listUsers(req.query as unknown as z.infer<typeof listUsersQuerySchema>));
  }),
);

router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    await ownerService.deleteUser(req.params.id, { id: req.user!.sub, ipAddress: req.ip });
    res.status(204).send();
  }),
);

router.get(
  "/organizations",
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await ownerService.listOrganizations(req.query as unknown as z.infer<typeof listQuerySchema>));
  }),
);

router.delete(
  "/organizations/:id",
  asyncHandler(async (req, res) => {
    await ownerService.deleteOrganization(req.params.id, { id: req.user!.sub, ipAddress: req.ip });
    res.status(204).send();
  }),
);

router.get(
  "/funds",
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    res.json(await ownerService.listFunds(req.query as unknown as z.infer<typeof listQuerySchema>));
  }),
);

router.delete(
  "/funds/:id",
  asyncHandler(async (req, res) => {
    await ownerService.deleteFund(req.params.id, { id: req.user!.sub, ipAddress: req.ip });
    res.status(204).send();
  }),
);

router.get(
  "/verification-requests",
  asyncHandler(async (_req, res) => {
    res.json({ requests: await ownerService.listVerificationRequests() });
  }),
);

router.post(
  "/verification-requests/:id/approve",
  asyncHandler(async (req, res) => {
    const organization = await ownerService.approveVerification(req.params.id, { id: req.user!.sub, ipAddress: req.ip });
    res.json({ organization });
  }),
);

router.post(
  "/verification-requests/:id/reject",
  validateBody(rejectVerificationSchema),
  asyncHandler(async (req, res) => {
    const organization = await ownerService.rejectVerification(req.params.id, req.body.reason, { id: req.user!.sub, ipAddress: req.ip });
    res.json({ organization });
  }),
);

export default router;
