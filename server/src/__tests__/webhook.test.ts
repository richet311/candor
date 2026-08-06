import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { stripe } from "../services/stripeService.js";
import { env } from "../config/env.js";
import { resetDb } from "./helpers.js";

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function seedPendingDonation() {
  const org = await prisma.organization.create({ data: { name: "Org", slug: `org-${Date.now()}` } });
  const admin = await prisma.user.create({ data: { email: `admin-${Date.now()}@org.com`, name: "Admin", role: "ADMIN", organizationId: org.id } });
  const fund = await prisma.fund.create({ data: { organizationId: org.id, name: "Fund", slug: `fund-${Date.now()}`, description: "d", category: "c", goalCents: 1000 } });
  const donor = await prisma.user.create({ data: { email: `donor-${Date.now()}@example.com`, name: "Donor", role: "DONOR" } });

  const donation = await prisma.donation.create({
    data: { fundId: fund.id, donorUserId: donor.id, amountCents: 2500, status: "PENDING", stripeCheckoutSessionId: `cs_test_${Date.now()}` },
  });

  return { donation, admin };
}

describe("stripe webhook", () => {
  it("rejects a request with an invalid signature and does not mutate the donation", async () => {
    const { donation } = await seedPendingDonation();
    const payload = JSON.stringify({ id: "evt_fake", type: "checkout.session.completed", data: { object: { id: donation.stripeCheckoutSessionId, payment_intent: "pi_fake" } } });

    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "t=1,v1=deadbeef")
      .send(payload);

    expect(res.status).toBe(400);

    const unchanged = await prisma.donation.findUnique({ where: { id: donation.id } });
    expect(unchanged?.status).toBe("PENDING");
  });

  it("marks a donation succeeded when the webhook signature is valid", async () => {
    const { donation } = await seedPendingDonation();
    const payload = JSON.stringify({
      id: "evt_real",
      type: "checkout.session.completed",
      data: { object: { id: donation.stripeCheckoutSessionId, payment_intent: "pi_real" } },
    });

    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: env.STRIPE_WEBHOOK_SECRET });

    const res = await request(app).post("/api/webhooks/stripe").set("Content-Type", "application/json").set("stripe-signature", signature).send(payload);

    expect(res.status).toBe(200);

    const updated = await prisma.donation.findUnique({ where: { id: donation.id } });
    expect(updated?.status).toBe("SUCCEEDED");
    expect(updated?.stripePaymentIntentId).toBe("pi_real");
  });
});
