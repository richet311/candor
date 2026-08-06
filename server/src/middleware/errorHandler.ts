import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { createLogger } from "../lib/logger.js";
import { isProd } from "../config/env.js";

const log = createLogger("http");

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    log.info({ path: req.path, issues: err.issues }, "request validation failed");
    res.status(422).json({
      error: "Invalid request",
      issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }

  if (err instanceof AppError) {
    const level = err.statusCode >= 500 ? "error" : "info";
    log[level]({ path: req.path, statusCode: err.statusCode, message: err.message }, "handled request error");
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  log.error({ path: req.path, err }, "unhandled request error");
  res.status(500).json({ error: isProd ? "Something went wrong" : (err as Error)?.message ?? "Unknown error" });
}
