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
  isAnonymous: z.boolean().optional().default(false),
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
      isAnonymous: req.body.isAnonymous,
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

// Public feed for the homepage activity ticker. Excludes the demo donor pool used by
// scripts/simulateDonations.ts: this feed should only ever show donations a real person
// actually made, not the background activity simulator. Donor identity is only ever
// included when that donor didn't opt into an anonymous donation.
router.get(
  "/recent",
  asyncHandler(async (_req, res) => {
    const donations = await prisma.donation.findMany({
      where: { status: "SUCCEEDED", donor: { isDemoDonor: false } },
      include: {
        fund: { select: { name: true, slug: true, organization: { select: { name: true } } } },
        donor: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    res.json({
      donations: donations.map((d) => ({
        id: d.id,
        amountCents: d.amountCents,
        createdAt: d.createdAt,
        donorName: d.isAnonymous ? null : (d.donor.username ?? d.donor.name),
        fund: { name: d.fund.name, slug: d.fund.slug, organizationName: d.fund.organization.name },
      })),
    });
  }),
);

export default router;
