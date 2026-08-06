import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { requireAuth } from "../middleware/auth.js";
import { env, isProd } from "../config/env.js";
import { UnauthorizedError } from "../utils/AppError.js";
import * as authService from "../services/authService.js";

const router = Router();

const REFRESH_COOKIE = "cf_refresh_token";

const passwordSchema = z.string().min(10, "Password must be at least 10 characters").max(200);
const emailSchema = z.string().trim().toLowerCase().email();

const registerDonorSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(120),
});

const registerOrgSchema = z.object({
  orgName: z.string().trim().min(2).max(160),
  adminEmail: emailSchema,
  adminPassword: passwordSchema,
  adminName: z.string().trim().min(1).max(120),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});

const googleLoginSchema = z.object({
  idToken: z.string().min(1),
});

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
}

router.post(
  "/register",
  authLimiter,
  validateBody(registerDonorSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.registerDonor(req.body, { ipAddress: req.ip, userAgent: req.headers["user-agent"] });
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({ user: result.user, accessToken: result.accessToken });
  }),
);

router.post(
  "/register-organization",
  authLimiter,
  validateBody(registerOrgSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.registerOrganization(req.body, { ipAddress: req.ip, userAgent: req.headers["user-agent"] });
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({ user: result.user, accessToken: result.accessToken });
  }),
);

router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.loginWithPassword(req.body, { ipAddress: req.ip, userAgent: req.headers["user-agent"] });
    setRefreshCookie(res, result.refreshToken);
    res.json({ user: result.user, accessToken: result.accessToken });
  }),
);

router.post(
  "/google",
  authLimiter,
  validateBody(googleLoginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.loginWithGoogle(req.body, { ipAddress: req.ip, userAgent: req.headers["user-agent"] });
    setRefreshCookie(res, result.refreshToken);
    res.json({ user: result.user, accessToken: result.accessToken });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedError("No active session");

    const result = await authService.refreshSession(token, { ipAddress: req.ip, userAgent: req.headers["user-agent"] });
    setRefreshCookie(res, result.refreshToken);
    res.json({ user: result.user, accessToken: result.accessToken });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) await authService.logout(token);
    clearRefreshCookie(res);
    res.status(204).send();
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);

export default router;
