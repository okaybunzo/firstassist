import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AUTH_COOKIE_NAME, verifyAuthToken, type AuthTokenPayload } from "../services/auth";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Not authenticated" });
  }
}

export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
