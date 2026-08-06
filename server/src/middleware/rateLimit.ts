import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { createLogger } from "../lib/logger.js";
import { recordAuditEvent } from "../services/auditService.js";
import { AuditAction } from "../types/audit.js";

const log = createLogger("rate-limit");

function onLimitExceeded(scope: string) {
  return async (req: Request, res: Response) => {
    log.warn({ scope, ip: req.ip, path: req.path }, "rate limit exceeded");
    await recordAuditEvent({
      action: AuditAction.RATE_LIMIT_EXCEEDED,
      metadata: { scope, path: req.path },
      ipAddress: req.ip,
    });
    res.status(429).json({ error: "Too many requests. Please try again later." });
  };
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: onLimitExceeded("auth"),
});

export const donationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: onLimitExceeded("donation"),
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: onLimitExceeded("api"),
});
