import Stripe from "stripe";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { createLogger } from "../lib/logger.js";
import { recordAuditEvent } from "./auditService.js";
import { AuditAction } from "../types/audit.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";

const log = createLogger("stripe");

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

interface CreateCheckoutInput {
  fundId: string;
  donorUserId: string;
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
}

export async function createDonationCheckout(input: CreateCheckoutInput) {
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
      status: "PENDING",
      stripeCheckoutSessionId: session.id,
    },
  });

  await recordAuditEvent({
    actorUserId: input.donorUserId,
    action: AuditAction.DONATION_INITIATED,
    targetType: "Fund",
    targetId: fund.id,
    metadata: { amountCents: input.amountCents },
  });

  if (!session.url) throw new ValidationError("Could not start checkout session");
  return { checkoutUrl: session.url };
}

export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const donation = await prisma.donation.findUnique({ where: { stripeCheckoutSessionId: session.id } });
  if (!donation) {
    log.warn({ sessionId: session.id }, "checkout completed for unknown donation record");
    return;
  }

  await prisma.donation.update({
    where: { id: donation.id },
    data: { status: "SUCCEEDED", stripePaymentIntentId: (session.payment_intent as string) ?? null },
  });

  await recordAuditEvent({
    actorUserId: donation.donorUserId,
    action: AuditAction.DONATION_SUCCEEDED,
    targetType: "Donation",
    targetId: donation.id,
    metadata: { amountCents: donation.amountCents, fundId: donation.fundId },
  });

  log.info({ donationId: donation.id, fundId: donation.fundId }, "donation succeeded");
}

export async function handleCheckoutSessionFailed(session: Stripe.Checkout.Session) {
  const donation = await prisma.donation.findUnique({ where: { stripeCheckoutSessionId: session.id } });
  if (!donation) return;

  await prisma.donation.update({ where: { id: donation.id }, data: { status: "FAILED" } });

  await recordAuditEvent({
    actorUserId: donation.donorUserId,
    action: AuditAction.DONATION_FAILED,
    targetType: "Donation",
    targetId: donation.id,
  });

  log.warn({ donationId: donation.id }, "donation failed or expired");
}
