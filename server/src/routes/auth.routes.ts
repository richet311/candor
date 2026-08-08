import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { authLimiter, verificationLimiter } from "../middleware/rateLimit.js";
import { requireAuth } from "../middleware/auth.js";
import { env, isProd } from "../config/env.js";
import { AppError, UnauthorizedError } from "../utils/AppError.js";
import { createLogger } from "../lib/logger.js";
import * as authService from "../services/authService.js";

const log = createLogger("oauth-routes");

const router = Router();

const REFRESH_COOKIE = "cf_refresh_token";

const passwordSchema = z.string().min(10, "Password must be at least 10 characters").max(200);
const emailSchema = z.string().trim().toLowerCase().email();

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be 24 characters or fewer")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

const registerDonorSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  username: usernameSchema,
});

const registerOrgSchema = z.object({
  orgName: z.string().trim().min(2).max(160),
  adminEmail: emailSchema,
  adminPassword: passwordSchema,
  adminFirstName: z.string().trim().min(1).max(60),
  adminLastName: z.string().trim().min(1).max(60),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});

const googleLoginSchema = z.object({
  idToken: z.string().min(1),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  username: usernameSchema.optional(),
  avatarUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    // In production the client and API are deployed on different registrable domains
    // (e.g. Cloudflare Pages + Render), so the cookie is genuinely cross-site and needs
    // SameSite=None to be sent at all; that requires Secure, which isProd already sets.
    // Locally both run on localhost, where Lax is the safer default and works the same.
    sameSite: isProd ? "none" : "lax",
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
    res.json({ user: result.user, accessToken: result.accessToken, event: result.event });
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
    res.json({ user: await authService.getMe(req.user!.sub) });
  }),
);

router.patch(
  "/me",
  requireAuth,
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(
      req.user!.sub,
      {
        name: req.body.name,
        username: req.body.username,
        avatarUrl: req.body.avatarUrl === undefined ? undefined : req.body.avatarUrl || null,
        bio: req.body.bio === undefined ? undefined : req.body.bio || null,
      },
      { ipAddress: req.ip, userAgent: req.headers["user-agent"] },
    );
    res.json({ user });
  }),
);

router.post(
  "/verify-email",
  authLimiter,
  validateBody(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.verifyEmail(req.body.token);
    res.json({ user });
  }),
);

router.post(
  "/resend-verification",
  requireAuth,
  verificationLimiter,
  asyncHandler(async (req, res) => {
    await authService.resendVerificationEmail(req.user!.sub, { ipAddress: req.ip, userAgent: req.headers["user-agent"] });
    res.status(204).send();
  }),
);

router.get("/oauth/providers", (_req, res) => {
  res.json({ providers: authService.availableOAuthProviders() });
});

function redirectToClientWithError(res: Response, message: string) {
  res.redirect(`${env.CLIENT_ORIGIN}/oauth/complete?error=${encodeURIComponent(message)}`);
}

router.get(
  "/oauth/:provider/start",
  authLimiter,
  (req, res) => {
    try {
      const { url } = authService.buildOAuthAuthorizeUrl(req.params.provider);
      res.redirect(url);
    } catch (err) {
      log.warn({ provider: req.params.provider, err }, "failed to start oauth flow");
      redirectToClientWithError(res, err instanceof AppError ? err.message : "Could not start sign-in");
    }
  },
);

async function finishOAuthCallback(
  provider: string,
  code: string | undefined,
  state: string | undefined,
  extra: Record<string, string> | undefined,
  req: Request,
  res: Response,
) {
  if (!code || !state) {
    redirectToClientWithError(res, "Sign-in was cancelled or incomplete");
    return;
  }

  try {
    const result = await authService.completeOAuthCallback(
      provider,
      code,
      state,
      { ipAddress: req.ip, userAgent: req.headers["user-agent"] },
      extra,
    );
    setRefreshCookie(res, result.refreshToken);
    res.redirect(`${env.CLIENT_ORIGIN}/oauth/complete?event=${result.event}`);
  } catch (err) {
    log.warn({ provider, err }, "oauth callback failed");
    redirectToClientWithError(res, err instanceof AppError ? err.message : "Sign-in failed");
  }
}

router.get(
  "/oauth/:provider/callback",
  asyncHandler(async (req, res) => {
    const { code, state, error } = req.query as Record<string, string | undefined>;
    if (error) {
      redirectToClientWithError(res, "Sign-in was cancelled");
      return;
    }
    await finishOAuthCallback(req.params.provider, code, state, undefined, req, res);
  }),
);

export default router;
