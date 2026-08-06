import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { donationLimiter } from "../middleware/rateLimit.js";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import * as stripeService from "../services/stripeService.js";

const router = Router();

const checkoutSchema = z.object({
  fundId: z.string().uuid(),
  amountCents: z.number().int().positive().max(1_000_000_00),
});

router.post(
  "/checkout",
  requireAuth,
  donationLimiter,
  validateBody(checkoutSchema),
  asyncHandler(async (req, res) => {
    const { checkoutUrl } = await stripeService.createDonationCheckout({
      fundId: req.body.fundId,
      donorUserId: req.user!.sub,
      amountCents: req.body.amountCents,
      successUrl: `${env.CLIENT_ORIGIN}/donate/success`,
      cancelUrl: `${env.CLIENT_ORIGIN}/donate/cancelled`,
    });

    res.json({ checkoutUrl });
  }),
);

router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const donations = await prisma.donation.findMany({
      where: { donorUserId: req.user!.sub },
      include: { fund: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ donations });
  }),
);

export default router;
