import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/tokens.js";
import { ForbiddenError, UnauthorizedError } from "../utils/AppError.js";
import { recordAuditEvent } from "../services/auditService.js";
import { AuditAction } from "../types/audit.js";
import type { Role } from "../../generated/client/index.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  try {
    req.user = verifyAccessToken(header.slice("Bearer ".length));
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }

  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError();

    if (!roles.includes(req.user.role)) {
      void recordAuditEvent({
        actorUserId: req.user.sub,
        action: AuditAction.AUTHZ_DENIED,
        metadata: { requiredRoles: roles, actualRole: req.user.role, path: req.path },
        ipAddress: req.ip,
      });
      throw new ForbiddenError("You do not have permission to perform this action");
    }

    next();
  };
}
