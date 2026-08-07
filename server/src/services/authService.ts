import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { createLogger } from "../lib/logger.js";
import { recordAuditEvent } from "./auditService.js";
import { AuditAction } from "../types/audit.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../utils/AppError.js";
import {
  hashToken,
  signAccessToken,
  signEmailVerificationToken,
  signOAuthState,
  signRefreshToken,
  verifyEmailVerificationToken,
  verifyOAuthState,
  verifyRefreshToken,
} from "../utils/tokens.js";
import { verifyGoogleIdToken } from "./googleAuthService.js";
import * as emailService from "./emailService.js";
import { getProvider, listProviders, type OAuthProfile, type OAuthProviderId } from "./oauthProviders.js";
import type { OAuthProvider as OAuthProviderEnum, Role, User } from "../../generated/client/index.js";

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

// A device is only "new" if the account has signed in from somewhere else before, a fresh
// registration's first session shouldn't alarm anyone, and only if we've genuinely never seen
// this exact user agent for this account. IP alone isn't a good fingerprint since it changes
// constantly on mobile networks and would make this fire on almost every login.
async function isNewDevice(userId: string, userAgent: string | null | undefined): Promise<boolean> {
  if (!userAgent) return false;
  const priorSessionCount = await prisma.refreshToken.count({ where: { userId } });
  if (priorSessionCount === 0) return false;
  const knownDevice = await prisma.refreshToken.findFirst({ where: { userId, userAgent } });
  return !knownDevice;
}

async function issueTokenPair(user: User, meta: RequestMeta): Promise<TokenPair> {
  const isNew = await isNewDevice(user.id, meta.userAgent);

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

  if (isNew) {
    await emailService.sendNewDeviceLoginEmail(user.email, user.name, {
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      when: new Date(),
    });
    await recordAuditEvent({
      actorUserId: user.id,
      action: AuditAction.AUTH_NEW_DEVICE_LOGIN,
      targetType: "User",
      targetId: user.id,
      metadata: { userAgent: meta.userAgent ?? null },
      ipAddress: meta.ipAddress,
    });
  }

  return { accessToken, refreshToken };
}

export type OAuthEvent = "returning" | "linked" | "created";

export async function findOrCreateOAuthUser(
  provider: OAuthProviderEnum,
  profile: OAuthProfile,
): Promise<{ user: User; event: OAuthEvent }> {
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: profile.providerAccountId } },
    include: { user: true },
  });
  if (existingAccount) return { user: existingAccount.user, event: "returning" };

  // Same email, no OAuthAccount for this provider yet: attach this provider to the existing
  // account rather than reject it as a duplicate, so a user who signed up with a password (or a
  // different provider) doesn't end up with two disconnected accounts for one email address.
  const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } });
  if (existingByEmail) {
    await prisma.oAuthAccount.create({ data: { userId: existingByEmail.id, provider, providerAccountId: profile.providerAccountId } });
    return { user: existingByEmail, event: "linked" };
  }

  const user = await prisma.$transaction(async (tx) => {
    // The OAuth provider already verified this email address, so there's nothing to confirm.
    const created = await tx.user.create({ data: { email: profile.email, name: profile.name, role: "DONOR", emailVerified: true } });
    await tx.oAuthAccount.create({ data: { userId: created.id, provider, providerAccountId: profile.providerAccountId } });
    return created;
  });
  return { user, event: "created" };
}

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    organizationId: user.organizationId,
    emailVerified: user.emailVerified,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError("Session expired, please sign in again");
  return publicUser(user);
}

export async function updateProfile(
  userId: string,
  input: { name?: string; avatarUrl?: string | null; bio?: string | null },
  meta: RequestMeta,
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: input.name, avatarUrl: input.avatarUrl, bio: input.bio },
  });

  await recordAuditEvent({ actorUserId: user.id, action: AuditAction.USER_PROFILE_UPDATED, targetType: "User", targetId: user.id, ipAddress: meta.ipAddress });
  log.info({ userId: user.id }, "profile updated");

  return publicUser(user);
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

  await emailService.sendVerificationEmail(user.email, user.name, signEmailVerificationToken(user.id));

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

  await emailService.sendVerificationEmail(user.email, user.name, signEmailVerificationToken(user.id));

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
  const { user, event } = await findOrCreateOAuthUser("GOOGLE", { providerAccountId: profile.googleId, email: profile.email, name: profile.name });

  await recordAuditEvent({ actorUserId: user.id, action: AuditAction.AUTH_GOOGLE_LOGIN, ipAddress: meta.ipAddress });
  log.info({ userId: user.id }, "google login succeeded");

  const tokens = await issueTokenPair(user, meta);
  return { user: publicUser(user), event, ...tokens };
}

export function availableOAuthProviders(): Record<string, boolean> {
  return {
    google: Boolean(env.GOOGLE_CLIENT_ID),
    ...Object.fromEntries(listProviders().map((p) => [p.id, p.isConfigured()])),
  };
}

function redirectUriFor(providerId: OAuthProviderId): string {
  return `${env.API_ORIGIN}/api/auth/oauth/${providerId}/callback`;
}

export function buildOAuthAuthorizeUrl(providerId: string): { url: string } {
  const provider = getProvider(providerId);
  if (!provider || !provider.isConfigured()) throw new NotFoundError("This sign-in provider isn't configured");

  const state = signOAuthState(provider.id);
  const url = provider.authorizeUrl(state, redirectUriFor(provider.id));
  return { url };
}

const OAUTH_PROVIDER_ENUM: Record<OAuthProviderId, OAuthProviderEnum> = {
  github: "GITHUB",
};

export async function completeOAuthCallback(
  providerId: string,
  code: string,
  state: string,
  meta: RequestMeta,
  extra?: Record<string, string>,
) {
  const provider = getProvider(providerId);
  if (!provider || !provider.isConfigured()) throw new NotFoundError("This sign-in provider isn't configured");

  verifyOAuthState(state, provider.id);

  const profile = await provider.exchangeCode(code, redirectUriFor(provider.id), extra);
  const { user, event } = await findOrCreateOAuthUser(OAUTH_PROVIDER_ENUM[provider.id], profile);

  await recordAuditEvent({
    actorUserId: user.id,
    action: AuditAction.AUTH_OAUTH_LOGIN,
    metadata: { provider: provider.id },
    ipAddress: meta.ipAddress,
  });
  log.info({ userId: user.id, provider: provider.id }, "oauth login succeeded");

  const tokens = await issueTokenPair(user, meta);
  return { user: publicUser(user), event, ...tokens };
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

export async function verifyEmail(token: string) {
  const userId = verifyEmailVerificationToken(token);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError("Invalid or expired verification link");

  if (user.emailVerified) return publicUser(user);

  const updated = await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  await recordAuditEvent({ actorUserId: user.id, action: AuditAction.EMAIL_VERIFIED, targetType: "User", targetId: user.id });
  log.info({ userId: user.id }, "email verified");

  return publicUser(updated);
}

export async function resendVerificationEmail(userId: string, meta: RequestMeta) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError("Session expired, please sign in again");
  if (user.emailVerified) return;

  await emailService.sendVerificationEmail(user.email, user.name, signEmailVerificationToken(user.id));
  await recordAuditEvent({ actorUserId: user.id, action: AuditAction.EMAIL_VERIFICATION_RESENT, targetType: "User", targetId: user.id, ipAddress: meta.ipAddress });
  log.info({ userId: user.id }, "verification email resent");
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
