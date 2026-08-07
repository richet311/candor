import express from "express";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { randomUUID } from "node:crypto";
import { logger } from "./lib/logger.js";
import { corsMiddleware, helmetMiddleware } from "./middleware/security.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.routes.js";
import organizationRouter from "./routes/organization.routes.js";
import fundRouter from "./routes/fund.routes.js";
import expenseRouter from "./routes/expense.routes.js";
import donationRouter from "./routes/donation.routes.js";
import webhookRouter from "./routes/webhook.routes.js";
import auditRouter from "./routes/audit.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import { UPLOADS_DIR } from "./lib/uploadsDir.js";

export function createApp() {
  const app = express();

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req.headers["x-request-id"] as string) || randomUUID(),
      customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info"),
    }),
  );

  app.use("/api/webhooks", webhookRouter);

  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use("/api", apiLimiter);

  app.use("/uploads", express.static(UPLOADS_DIR, { maxAge: "7d" }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRouter);
  app.use("/api/organizations", organizationRouter);
  app.use("/api/funds", fundRouter);
  app.use("/api/expenses", expenseRouter);
  app.use("/api/donations", donationRouter);
  app.use("/api/audit-log", auditRouter);
  app.use("/api/uploads", uploadRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
