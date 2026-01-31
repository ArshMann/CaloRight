import { verify, type JwtPayload } from "jsonwebtoken";
import { sendError } from "../httpError";
import type { Request, Response, NextFunction } from "express";

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing`);
  return v;
}

const ACCESS_SECRET = mustGetEnv("JWT_ACCESS_SECRET");

export type AuthedRequest = Request & { userId?: string };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return sendError(res, 401, "INVALID_CREDENTIALS", "Missing access token.");
  }

  const token = header.slice("bearer ".length).trim();

  try {
    const payload = verify(token, ACCESS_SECRET) as JwtPayload;
    const userId = payload.sub;

    if (typeof userId !== "string") {
      return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid access token.");
    }

    req.userId = userId;
    next();
  } catch {
    return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid or expired access token.");
  }
}
