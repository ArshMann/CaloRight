import type { Response } from "express";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_ALREADY_EXISTS"
  | "INVALID_CREDENTIALS"
  | "INTERNAL_ERROR"
  | "FORBIDDEN"
  | "NOT_FOUND";

export function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string
) {
  return res.status(status).json({ error: { code, message } });
}
