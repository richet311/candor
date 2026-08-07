import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError } from "./AppError.js";
import type { Role } from "../../generated/client/index.js";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  organizationId: string | null;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(userId: string): { token: string; jti: string; expiresAt: Date } {
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const refreshOptions: jwt.SignOptions = { expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` as jwt.SignOptions["expiresIn"] };
  const token = jwt.sign({ sub: userId, jti } satisfies RefreshTokenPayload, env.JWT_REFRESH_SECRET, refreshOptions);
  return { token, jti, expiresAt };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

interface OAuthStatePayload {
  purpose: "oauth_state";
  provider: string;
  nonce: string;
}

export function signOAuthState(provider: string): string {
  const payload: OAuthStatePayload = { purpose: "oauth_state", provider, nonce: crypto.randomBytes(16).toString("hex") };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "10m" });
}

export function verifyOAuthState(state: string, expectedProvider: string): void {
  let payload: OAuthStatePayload;
  try {
    payload = jwt.verify(state, env.JWT_ACCESS_SECRET) as OAuthStatePayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired sign-in attempt, please try again");
  }
  if (payload.purpose !== "oauth_state" || payload.provider !== expectedProvider) {
    throw new UnauthorizedError("Invalid or expired sign-in attempt, please try again");
  }
}

interface EmailVerificationPayload {
  purpose: "email_verification";
  sub: string;
}

export function signEmailVerificationToken(userId: string): string {
  return jwt.sign({ purpose: "email_verification", sub: userId } satisfies EmailVerificationPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: "24h",
  });
}

export function verifyEmailVerificationToken(token: string): string {
  let payload: EmailVerificationPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as EmailVerificationPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired verification link");
  }
  if (payload.purpose !== "email_verification") {
    throw new UnauthorizedError("Invalid or expired verification link");
  }
  return payload.sub;
}
