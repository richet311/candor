import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildLimiter } from "../middleware/rateLimit.js";

describe("rate limiting", () => {
  it("allows requests under the limit and blocks once it's exceeded", async () => {
    const app = express();
    app.use(buildLimiter("test-scope", { windowMs: 60_000, limit: 3, skip: () => false }));
    app.get("/ping", (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 3; i++) {
      const res = await request(app).get("/ping");
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).get("/ping");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many requests/i);
  });
});
