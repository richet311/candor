import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { createLogger } from "../lib/logger.js";
import { recordAuditEvent } from "./auditService.js";
import { AuditAction } from "../types/audit.js";
import { ConflictError, UnauthorizedError } from "../utils/AppError.js";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";
import { verifyGoogleIdToken } from "./googleAuthService.js";
import type { Role, User } from "../../generated/client/index.js";

const log = createLogger("auth");

const BCRYPT_COST = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

interface RequestMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

async function issueTokenPair(user: User, meta: RequestMeta): Promise<TokenPair> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, organizationId: user.organizationId });
  const { token: refreshToken, expiresAt } = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      userAgent: meta.userAgent ?? undefined,
      ipAddress: meta.ipAddress ?? undefined,
    },
  });

  return { accessToken, refreshToken };
}

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
  };
}

export async function registerDonor(input: { email: string; password: string; name: string }, meta: RequestMeta) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name, role: "DONOR" },
  });

  await recordAuditEvent({ actorUserId: user.id, action: AuditAction.AUTH_REGISTER, targetType: "User", targetId: user.id, ipAddress: meta.ipAddress });
  log.info({ userId: user.id }, "donor registered");

  const tokens = await issueTokenPair(user, meta);
  return { user: publicUser(user), ...tokens };
}

export async function registerOrganization(
  input: { orgName: string; adminEmail: string; adminPassword: string; adminName: string },
  meta: RequestMeta,
) {
  const existing = await prisma.user.findUnique({ where: { email: input.adminEmail } });
  if (existing) throw new ConflictError("An account with this email already exists");

  const slug = input.orgName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const passwordHash = await bcrypt.hash(input.adminPassword, BCRYPT_COST);

  const user = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: input.orgName, slug: `${slug}-${Date.now().toString(36)}` } });
    return tx.user.create({
      data: { email: input.adminEmail, passwordHash, name: input.adminName, role: "ADMIN", organizationId: org.id },
    });
  });

  await recordAuditEvent({ actorUserId: user.id, action: AuditAction.AUTH_REGISTER, targetType: "Organization", targetId: user.organizationId ?? undefined, ipAddress: meta.ipAddress });
  log.info({ userId: user.id, organizationId: user.organizationId }, "organization + admin registered");

  const tokens = await issueTokenPair(user, meta);
  return { user: publicUser(user), ...tokens };
}

export async function loginWithPassword(input: { email: string; password: string }, meta: RequestMeta) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.passwordHash) {
    await recordAuditEvent({ action: AuditAction.AUTH_LOGIN_FAILED, metadata: { email: input.email, reason: "no_such_account" }, ipAddress: meta.ipAddress });
    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await recordAuditEvent({ actorUserId: user.id, action: AuditAction.AUTH_LOGIN_FAILED, metadata: { reason: "account_locked" }, ipAddress: meta.ipAddress });
    throw new UnauthorizedError("Account temporarily locked due to repeated failed attempts. Try again later.");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const lockedUntil = failedLoginAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;

    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts, lockedUntil } });
    await recordAuditEvent({ actorUserId: user.id, action: AuditAction.AUTH_LOGIN_FAILED, metadata: { reason: "bad_password", attempt: failedLoginAttempts }, ipAddress: meta.ipAddress });

    if (lockedUntil) {
      await recordAuditEvent({ actorUserId: user.id, action: AuditAction.AUTH_ACCOUNT_LOCKED, metadata: { lockedUntil }, ipAddress: meta.ipAddress });
      log.warn({ userId: user.id }, "account locked after repeated failed logins");
    }

    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  }

  await recordAuditEvent({ actorUserId: user.id, action: AuditAction.AUTH_LOGIN_SUCCESS, ipAddress: meta.ipAddress });
  log.info({ userId: user.id }, "login succeeded");

  const tokens = await issueTokenPair(user, meta);
  return { user: publicUser(user), ...tokens };
}

export async function loginWithGoogle(input: { idToken: string }, meta: RequestMeta) {
  const profile = await verifyGoogleIdToken(input.idToken);

  let user = await prisma.user.findUnique({ where: { googleId: profile.googleId } });

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } });
    user = existingByEmail
      ? await prisma.user.update({ where: { id: existingByEmail.id }, data: { googleId: profile.googleId } })
      : await prisma.user.create({ data: { email: profile.email, name: profile.name, googleId: profile.googleId, role: "DONOR" } });
  }

  await recordAuditEvent({ actorUserId: user.id, action: AuditAction.AUTH_GOOGLE_LOGIN, ipAddress: meta.ipAddress });
  log.info({ userId: user.id }, "google login succeeded");

  const tokens = await issueTokenPair(user, meta);
  return { user: publicUser(user), ...tokens };
}

export async function refreshSession(refreshToken: string, meta: RequestMeta) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Session expired, please sign in again");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.userId !== payload.sub) {
    throw new UnauthorizedError("Session expired, please sign in again");
  }

  if (stored.revokedAt) {
    log.error({ userId: stored.userId }, "refresh token reuse detected, revoking all sessions for user");
    await prisma.refreshToken.updateMany({ where: { userId: stored.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await recordAuditEvent({ actorUserId: stored.userId, action: AuditAction.AUTH_REFRESH_REUSE_DETECTED, ipAddress: meta.ipAddress });
    throw new UnauthorizedError("Session invalidated, please sign in again");
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw new UnauthorizedError("Session expired, please sign in again");

  const { token: newRefreshToken, expiresAt } = signRefreshToken(user.id);
  const newTokenHash = hashToken(newRefreshToken);

  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date(), replacedByTokenHash: newTokenHash } }),
    prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: newTokenHash, expiresAt, userAgent: meta.userAgent ?? undefined, ipAddress: meta.ipAddress ?? undefined },
    }),
  ]);

  const accessToken = signAccessToken({ sub: user.id, role: user.role, organizationId: user.organizationId });
  await recordAuditEvent({ actorUserId: user.id, action: AuditAction.AUTH_REFRESH, ipAddress: meta.ipAddress });

  return { user: publicUser(user), accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt) return;

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  await recordAuditEvent({ actorUserId: stored.userId, action: AuditAction.AUTH_LOGOUT });
  log.info({ userId: stored.userId }, "logged out");
}

export type { Role };
