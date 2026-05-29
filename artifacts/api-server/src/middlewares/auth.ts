import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    logger.error("FATAL: JWT_SECRET environment variable is not set. Refusing to start in production.");
    process.exit(1);
  } else {
    logger.warn("JWT_SECRET is not set. Using an insecure default for development only. Set JWT_SECRET before going to production.");
  }
}

const EFFECTIVE_SECRET = JWT_SECRET || "dev_only_insecure_fallback_do_not_use_in_production";

export type UserRole = "customer" | "vendor" | "partner" | "admin";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  phone: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, EFFECTIVE_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Requires one of the following roles: ${roles.join(", ")}`,
      });
      return;
    }
    next();
  };
};

export const requireAdmin = [requireAuth, requireRole("admin")] as const;

export const requireVendorOrAdmin = [requireAuth, requireRole("vendor", "admin")] as const;

export const requireRiderOrAdmin = [requireAuth, requireRole("partner", "admin")] as const;

export const generateToken = (payload: AuthenticatedUser): string => {
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: "7d" });
};
