import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { resetDb } from "./helpers.js";

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("donor registration and login", () => {
  it("registers a donor and returns an access token plus a refresh cookie", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dana@example.com", password: "correcthorsebattery", firstName: "Dana", lastName: "Donor", username: "dana_d" });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("DONOR");
    expect(res.body.user.name).toBe("Dana Donor");
    expect(res.body.user.username).toBe("dana_d");
    expect(res.body.accessToken).toBeTypeOf("string");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/cf_refresh_token=/);
  });

  it("rejects a second registration with the same email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "dana@example.com", password: "correcthorsebattery", firstName: "Dana", lastName: "One", username: "dana1" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dana@example.com", password: "anotherpassword1", firstName: "Dana", lastName: "Two", username: "dana2" });

    expect(res.status).toBe(409);
  });

  it("rejects a second registration with the same username but a different email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "first@example.com", password: "correcthorsebattery", firstName: "First", lastName: "User", username: "shared_name" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "second@example.com", password: "correcthorsebattery", firstName: "Second", lastName: "User", username: "shared_name" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/username/i);
  });

  it("rejects a username with characters outside letters, numbers, and underscores", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "badname@example.com", password: "correcthorsebattery", firstName: "Bad", lastName: "Name", username: "not a username!" });

    expect(res.status).toBe(422);
  });

  it("rejects a password shorter than 10 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "short@example.com", password: "short1", firstName: "Short", lastName: "Pass", username: "shortpass" });
    expect(res.status).toBe(422);
  });

  it("tells the user their account doesn't exist yet, distinct from a wrong password", async () => {
    const noAccount = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "whatever123" });
    expect(noAccount.status).toBe(401);
    expect(noAccount.body.error).toMatch(/no candor account/i);

    await request(app)
      .post("/api/auth/register")
      .send({ email: "wrongpass@example.com", password: "correcthorsebattery", firstName: "Wrong", lastName: "Pass", username: "wrongpassuser" });
    const wrongPassword = await request(app).post("/api/auth/login").send({ email: "wrongpass@example.com", password: "notthepassword" });
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error).not.toMatch(/no candor account/i);
  });

  it("locks the account after five failed login attempts", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "lockout@example.com", password: "correcthorsebattery", firstName: "Lock", lastName: "Out", username: "lockout" });

    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/auth/login").send({ email: "lockout@example.com", password: "wrongpassword" });
    }

    const res = await request(app).post("/api/auth/login").send({ email: "lockout@example.com", password: "correcthorsebattery" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/locked/i);
  });

  it("flags a login from an unseen device but not the registration session or a repeat device", async () => {
    await request(app)
      .post("/api/auth/register")
      .set("User-Agent", "device-a")
      .send({ email: "roaming@example.com", password: "correcthorsebattery", firstName: "Road", lastName: "Warrior", username: "roamer" });

    await request(app).post("/api/auth/login").set("User-Agent", "device-a").send({ email: "roaming@example.com", password: "correcthorsebattery" });
    await request(app).post("/api/auth/login").set("User-Agent", "device-b").send({ email: "roaming@example.com", password: "correcthorsebattery" });

    const events = await prisma.auditLog.findMany({ where: { action: "auth.new_device_login" } });
    expect(events).toHaveLength(1);
  });
});

describe("role-based access control", () => {
  it("blocks a donor from creating a fund", async () => {
    const donor = await request(app)
      .post("/api/auth/register")
      .send({ email: "donor@example.com", password: "correcthorsebattery", firstName: "Don", lastName: "Or", username: "donor1" });

    const res = await request(app)
      .post("/api/funds")
      .set("Authorization", `Bearer ${donor.body.accessToken}`)
      .send({ name: "Should fail", description: "Donor is not an org admin", category: "test", goalCents: 1000 });

    expect(res.status).toBe(403);
  });

  it("blocks an unauthenticated request from creating a fund", async () => {
    const res = await request(app)
      .post("/api/funds")
      .send({ name: "Should fail", description: "No token provided at all", category: "test", goalCents: 1000 });

    expect(res.status).toBe(401);
  });

  it("lets an org admin create a fund and log an expense against it, scoped to their org", async () => {
    const adminA = await request(app)
      .post("/api/auth/register-organization")
      .send({ orgName: "Org A", adminEmail: "a@org.com", adminPassword: "correcthorsebattery", adminFirstName: "Admin", adminLastName: "A" });
    const adminB = await request(app)
      .post("/api/auth/register-organization")
      .send({ orgName: "Org B", adminEmail: "b@org.com", adminPassword: "correcthorsebattery", adminFirstName: "Admin", adminLastName: "B" });

    const fund = await request(app)
      .post("/api/funds")
      .set("Authorization", `Bearer ${adminA.body.accessToken}`)
      .send({ name: "Org A Fund", description: "Belongs to org A only", category: "test", goalCents: 5000 });

    expect(fund.status).toBe(201);

    const crossOrgExpense = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${adminB.body.accessToken}`)
      .send({ fundId: fund.body.fund.id, category: "test", description: "org B should not be able to do this", amountCents: 100 });

    expect(crossOrgExpense.status).toBe(403);

    const ownExpense = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${adminA.body.accessToken}`)
      .send({ fundId: fund.body.fund.id, category: "test", description: "org A logging its own expense", amountCents: 100 });

    expect(ownExpense.status).toBe(201);
  });
});
