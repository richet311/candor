import Stripe from "stripe";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { createLogger } from "../lib/logger.js";
import { recordAuditEvent } from "./auditService.js";
import { AuditAction } from "../types/audit.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../utils/AppError.js";
import * as emailService from "./emailService.js";

const log = createLogger("stripe");

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

interface CreateCheckoutInput {
  fundId: string;
  donorUserId: string;
  amountCents: number;
  isAnonymous: boolean;
  successUrl: string;
  cancelUrl: string;
}

export async function createDonationCheckout(input: CreateCheckoutInput) {
  const donor = await prisma.user.findUnique({ where: { id: input.donorUserId } });
  if (!donor) throw new NotFoundError("Account not found");
  // Org staff manage funds; they don't give to them. A donor identity is a separate account.
  if (donor.role === "ADMIN") throw new ForbiddenError("Organization accounts can't donate. Log in with a donor account to give.");
  if (!donor.emailVerified) throw new ForbiddenError("Please verify your email before donating");

  const fund = await prisma.fund.findUnique({ where: { id: input.fundId } });
  if (!fund || !fund.isActive) throw new NotFoundError("Fund not found or no longer active");
  if (input.amountCents < 100) throw new ValidationError("Minimum donation is $1.00");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: input.amountCents,
          product_data: { name: `Donation to ${fund.name}` },
        },
        quantity: 1,
      },
    ],
    metadata: { fundId: fund.id, donorUserId: input.donorUserId },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });

  await prisma.donation.create({
    data: {
      fundId: fund.id,
      donorUserId: input.donorUserId,
      amountCents: input.amountCents,
      isAnonymous: input.isAnonymous,
      status: "PENDING",
      stripeCheckoutSessionId: session.id,
    },
  });

  await recordAuditEvent({
    actorUserId: input.donorUserId,
    action: AuditAction.DONATION_INITIATED,
    targetType: "Fund",
    targetId: fund.id,
    metadata: { amountCents: input.amountCents, fundName: fund.name },
  });

  if (!session.url) throw new ValidationError("Could not start checkout session");
  return { checkoutUrl: session.url };
}

export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const donation = await prisma.donation.findUnique({
    where: { stripeCheckoutSessionId: session.id },
    include: { fund: { select: { name: true } } },
  });
  if (!donation) {
    log.warn({ sessionId: session.id }, "checkout completed for unknown donation record");
    return;
  }

  await prisma.donation.update({
    where: { id: donation.id },
    data: { status: "SUCCEEDED", stripePaymentIntentId: (session.payment_intent as string) ?? null },
  });

  // targetType/targetId point at the Fund (not the Donation) so the org's audit log, which is
  // scoped by fund ownership, can actually find donation activity for its own funds.
  await recordAuditEvent({
    actorUserId: donation.donorUserId,
    action: AuditAction.DONATION_SUCCEEDED,
    targetType: "Fund",
    targetId: donation.fundId,
    metadata: { amountCents: donation.amountCents, fundName: donation.fund.name, donationId: donation.id },
  });

  log.info({ donationId: donation.id, fundId: donation.fundId }, "donation succeeded");

  await sendReceiptEmail(donation.id);
}

// Isolated so a failure here (bad email, provider outage) never affects the webhook's own
// success path above, Stripe only cares that we returned 200.
async function sendReceiptEmail(donationId: string) {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { donor: true, fund: { include: { organization: true } } },
    });
    if (!donation) return;
    // The background simulator donates as the demo donor pool, don't email fake inboxes.
    if (donation.donor.isDemoDonor) return;

    const orgTotal = await prisma.donation.aggregate({
      where: {
        donorUserId: donation.donorUserId,
        status: "SUCCEEDED",
        fund: { organizationId: donation.fund.organizationId },
      },
      _sum: { amountCents: true },
    });

    await emailService.sendDonationReceiptEmail({
      to: donation.donor.email,
      name: donation.donor.name,
      amountCents: donation.amountCents,
      fundName: donation.fund.name,
      organizationName: donation.fund.organization.name,
      orgTotalCents: orgTotal._sum.amountCents ?? donation.amountCents,
    });
  } catch (err) {
    log.error({ err, donationId }, "failed to send donation receipt email");
  }
}

export async function handleCheckoutSessionFailed(session: Stripe.Checkout.Session) {
  const donation = await prisma.donation.findUnique({
    where: { stripeCheckoutSessionId: session.id },
    include: { fund: { select: { name: true } } },
  });
  if (!donation) return;

  await prisma.donation.update({ where: { id: donation.id }, data: { status: "FAILED" } });

  await recordAuditEvent({
    actorUserId: donation.donorUserId,
    action: AuditAction.DONATION_FAILED,
    targetType: "Fund",
    targetId: donation.fundId,
    metadata: { amountCents: donation.amountCents, fundName: donation.fund.name, donationId: donation.id },
  });

  log.warn({ donationId: donation.id }, "donation failed or expired");
}
