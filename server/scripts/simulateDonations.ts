// Simulates live donation activity on seeded verified nonprofits (see seedNonprofits.ts).
// Rather than writing a SUCCEEDED donation row directly, this builds a real
// checkout.session.completed event, signs it with the real webhook secret, and POSTs it to the
// running server's actual /api/webhooks/stripe route, the same path a real Stripe donation
// takes. Requires the API server to already be running.
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma.js";
import { env } from "../src/config/env.js";
import { createLogger } from "../src/lib/logger.js";
import { stripe } from "../src/services/stripeService.js";
import { ensureDemoDonors } from "./demoData.js";

const log = createLogger("simulate-donations");

const DONATION_AMOUNTS_CENTS = [1000, 2000, 2500, 3000, 5000, 7500, 10000, 15000, 20000];
const MIN_INTERVAL_MS = Number(process.env.SIMULATE_MIN_MS ?? 15_000);
const MAX_INTERVAL_MS = Number(process.env.SIMULATE_MAX_MS ?? 45_000);

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDelayMs(): number {
  return MIN_INTERVAL_MS + Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS));
}

async function simulateOneDonation(donorIds: string[]) {
  const funds = await prisma.fund.findMany({
    where: { isActive: true, organization: { verified: true } },
    select: { id: true, name: true },
  });

  if (funds.length === 0) {
    log.warn("no verified funds found, run `npm run seed:nonprofits` first");
    return;
  }

  const fund = pickRandom(funds);
  const donorId = pickRandom(donorIds);
  const amountCents = pickRandom(DONATION_AMOUNTS_CENTS);
  const sessionId = `cs_sim_${randomUUID()}`;

  await prisma.donation.create({
    data: { fundId: fund.id, donorUserId: donorId, amountCents, status: "PENDING", stripeCheckoutSessionId: sessionId },
  });

  const payload = JSON.stringify({
    id: `evt_sim_${randomUUID()}`,
    type: "checkout.session.completed",
    data: { object: { id: sessionId, payment_intent: `pi_sim_${randomUUID()}` } },
  });

  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: env.STRIPE_WEBHOOK_SECRET });

  const res = await fetch(`${env.API_ORIGIN}/api/webhooks/stripe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": signature },
    body: payload,
  });

  if (!res.ok) {
    log.error({ status: res.status, fund: fund.name }, "simulated donation webhook was rejected");
    return;
  }

  log.info({ fund: fund.name, amountCents }, "simulated donation completed");
}

async function main() {
  const runOnce = process.argv.includes("--once");
  const donors = await ensureDemoDonors();
  const donorIds = donors.map((d) => d.id);

  let stopped = false;
  const stop = () => {
    stopped = true;
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  do {
    await simulateOneDonation(donorIds).catch((err) => log.error({ err }, "simulated donation failed"));
    if (runOnce) break;
    await new Promise((resolve) => setTimeout(resolve, randomDelayMs()));
  } while (!stopped);

  await prisma.$disconnect();
}

void main();
