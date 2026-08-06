import { Router } from "express";
import express from "express";
import { createLogger } from "../lib/logger.js";
import { recordAuditEvent } from "../services/auditService.js";
import { AuditAction } from "../types/audit.js";
import * as stripeService from "../services/stripeService.js";

const router = Router();
const log = createLogger("webhook");

router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (typeof signature !== "string") {
    res.status(400).json({ error: "Missing Stripe signature" });
    return;
  }

  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, signature);
  } catch (err) {
    log.warn({ err }, "stripe webhook signature verification failed");
    await recordAuditEvent({ action: AuditAction.WEBHOOK_SIGNATURE_INVALID, ipAddress: req.ip });
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await stripeService.handleCheckoutSessionCompleted(event.data.object);
        break;
      case "checkout.session.expired":
        await stripeService.handleCheckoutSessionFailed(event.data.object);
        break;
      default:
        log.debug({ type: event.type }, "unhandled stripe event type");
    }
    res.json({ received: true });
  } catch (err) {
    log.error({ err, type: event.type }, "failed to process stripe webhook event");
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
