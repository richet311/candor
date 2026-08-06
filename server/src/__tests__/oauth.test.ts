import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { findOrCreateOAuthUser } from "../services/authService.js";
import { signOAuthState, verifyOAuthState } from "../utils/tokens.js";
import { resetDb } from "./helpers.js";

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("OAuth state CSRF token", () => {
  it("round-trips for the provider it was issued for", () => {
    const state = signOAuthState("github");
    expect(() => verifyOAuthState(state, "github")).not.toThrow();
  });

  it("rejects a state issued for a different provider", () => {
    const state = signOAuthState("github");
    expect(() => verifyOAuthState(state, "google")).toThrow();
  });

  it("rejects a tampered token", () => {
    const state = signOAuthState("github");
    expect(() => verifyOAuthState(`${state}tampered`, "github")).toThrow();
  });
});

describe("findOrCreateOAuthUser", () => {
  const profile = { providerAccountId: "gh-123", email: "dana@example.com", name: "Dana Donor" };

  it("creates a new user and links the provider account", async () => {
    const user = await findOrCreateOAuthUser("GITHUB", profile);
    expect(user.email).toBe(profile.email);

    const account = await prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: "GITHUB", providerAccountId: profile.providerAccountId } },
    });
    expect(account?.userId).toBe(user.id);
  });

  it("links to an existing user with the same email instead of creating a duplicate", async () => {
    const existing = await prisma.user.create({ data: { email: profile.email, name: "Existing Dana", role: "DONOR" } });

    const linked = await findOrCreateOAuthUser("GITHUB", profile);

    expect(linked.id).toBe(existing.id);
    const totalUsers = await prisma.user.count({ where: { email: profile.email } });
    expect(totalUsers).toBe(1);
  });

  it("returns the same user on repeated sign-ins without creating duplicate accounts", async () => {
    const first = await findOrCreateOAuthUser("GITHUB", profile);
    const second = await findOrCreateOAuthUser("GITHUB", profile);

    expect(second.id).toBe(first.id);
    const accountCount = await prisma.oAuthAccount.count({
      where: { provider: "GITHUB", providerAccountId: profile.providerAccountId },
    });
    expect(accountCount).toBe(1);
  });
});

describe("OAuth HTTP routes", () => {
  it("lists provider availability as booleans", async () => {
    const res = await request(app).get("/api/auth/oauth/providers");
    expect(res.status).toBe(200);
    for (const key of ["google", "github"]) {
      expect(typeof res.body.providers[key]).toBe("boolean");
    }
  });

  it("redirects to the client with an error for an unrecognized provider", async () => {
    const res = await request(app).get("/api/auth/oauth/not-a-real-provider/start");
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("/oauth/complete?error=");
  });

  it("redirects with an error when the callback is missing code or state", async () => {
    const res = await request(app).get("/api/auth/oauth/github/callback");
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("/oauth/complete?error=");
  });

  it("redirects with an error for a validly-signed state if the provider isn't recognized", async () => {
    const state = signOAuthState("not-a-real-provider");
    const res = await request(app).get(`/api/auth/oauth/not-a-real-provider/callback?code=fake&state=${state}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("/oauth/complete?error=");
  });
});
