import rateLimit, { type Options } from "express-rate-limit";
import type { Request, Response } from "express";
import { createLogger } from "../lib/logger.js";
import { recordAuditEvent } from "../services/auditService.js";
import { AuditAction } from "../types/audit.js";
import { env } from "../config/env.js";

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

export function buildLimiter(scope: string, options: Partial<Options> & { windowMs: number; limit: number }) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: onLimitExceeded(scope),
    // Functional/integration tests share one Express app (and therefore one
    // in-memory limiter store) across many requests in the same run; the
    // mechanism itself is covered in isolation by rateLimit.test.ts instead.
    skip: () => env.NODE_ENV === "test",
    ...options,
  });
}

export const authLimiter = buildLimiter("auth", { windowMs: 15 * 60 * 1000, limit: 10 });
export const donationLimiter = buildLimiter("donation", { windowMs: 60 * 60 * 1000, limit: 20 });
export const apiLimiter = buildLimiter("api", { windowMs: 15 * 60 * 1000, limit: 300 });
export const verificationLimiter = buildLimiter("email-verification", { windowMs: 15 * 60 * 1000, limit: 3 });
