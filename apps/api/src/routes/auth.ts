import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../db";
import { sendError } from "../httpError";
import { requireAuth, type AuthedRequest } from "../auth/requireAuth";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from "../auth/tokens";

const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? "refresh_token";

function getRefreshCookieOptions() {
  const secure = process.env.REFRESH_COOKIE_SECURE === "true";
  const sameSite = (process.env.REFRESH_COOKIE_SAMESITE ?? "lax") as "lax" | "strict" | "none";
  const path = process.env.REFRESH_COOKIE_PATH ?? "/auth/refresh";

  return {
    httpOnly: true,
    secure,
    sameSite,
    path,
  } as const;
}

function getRefreshCookie(req: any): string | null {
  const name = REFRESH_COOKIE_NAME;
  const token = req.cookies?.[name];
  return typeof token === "string" ? token : null;
}

function clearRefreshCookie(res: any) {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
}

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const emailRaw = req.body?.email;
    const passwordRaw = req.body?.password;

    // 1) Basic validation
    if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") {
      return sendError(res, 400, "VALIDATION_ERROR", "Email and password are required.");
    }

    const email = emailRaw.trim().toLowerCase();
    const password = passwordRaw;

    if (!email.includes("@")) {
      return sendError(res, 400, "VALIDATION_ERROR", "Email must be valid.");
    }

    if (password.length < 8) {
      return sendError(res, 400, "VALIDATION_ERROR", "Password must be at least 8 characters.");
    }

    // 2) Check duplicate
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, 409, "EMAIL_ALREADY_EXISTS", "An account with that email already exists.");
    }

    // 3) Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 4) Create user
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });

    // 5) Respond
    return res.status(201).json({ user });
  } catch (err) {
    console.error("REGISTER_ERROR:", err);
    return sendError(res, 500, "INTERNAL_ERROR", "Something went wrong.");
  }
});

authRouter.post("/login", async (req, res) => {
    try {
        const emailRaw = req.body?.email;
        const passwordRaw = req.body?.password;

        if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") {
        return sendError(res, 400, "VALIDATION_ERROR", "Email and password are required.");
        }

        const email = emailRaw.trim().toLowerCase();
        const password = passwordRaw;

        const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, passwordHash: true },
        });

        // Same message for "not found" and "wrong password"
        if (!user) {
        return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
        return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
        }

        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        // Store hashed refresh token in DB
        const tokenHash = hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await prisma.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash,
            expiresAt,
        },
        });

        // Set refresh token cookie
        res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

        // Return access token + user
        return res.status(200).json({
        accessToken,
        user: { id: user.id, email: user.email },
        });

    } catch (err) {
        console.error("LOGIN_ERROR:", err);
        return sendError(res, 500, "INTERNAL_ERROR", "Something went wrong.");
    }
});

authRouter.post("/refresh", async (req, res) => {
  try {
    const refreshToken = getRefreshCookie(req);
    if (!refreshToken) {
      return sendError(res, 401, "INVALID_CREDENTIALS", "Missing refresh token.");
    }

    // 1) Verify JWT refresh token signature + payload
    let userId: string;
    try {
      userId = verifyRefreshToken(refreshToken).userId;
    } catch {
      return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid refresh token.");
    }

    // 2) Check DB: token must exist and not be revoked and not expired
    const tokenHash = hashToken(refreshToken);
    const dbToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, revokedAt: true, expiresAt: true },
    });

    if (!dbToken || dbToken.revokedAt || dbToken.expiresAt <= new Date()) {
      return sendError(res, 401, "INVALID_CREDENTIALS", "Refresh token is revoked or expired.");
    }

    // Extra safety: token belongs to same user
    if (dbToken.userId !== userId) {
      return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid refresh token.");
    }

    // 3) Rotate: revoke old + create new
    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revokedAt: new Date() },
    });

    const newRefreshToken = signRefreshToken(userId);
    const newHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: newHash,
        expiresAt,
      },
    });

    // 4) Set new cookie + return new access token
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());

    const accessToken = signAccessToken(userId);
    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error("REFRESH_ERROR:", err);
    return sendError(res, 500, "INTERNAL_ERROR", "Something went wrong.");
  }
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return sendError(res, 401, "INVALID_CREDENTIALS", "User not found.");
  }

  return res.json({ user });
});

authRouter.post("/logout", async (req, res) => {
  try {
    const refreshToken = getRefreshCookie(req);

    // Always clear cookie (even if missing/invalid)
    clearRefreshCookie(res);

    if (!refreshToken) {
      return res.sendStatus(204);
    }

    // Revoke in DB if we can find it
    const tokenHash = hashToken(refreshToken);
    const existing = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { id: true, revokedAt: true },
    });

    if (existing && !existing.revokedAt) {
      await prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      });
    }

    return res.sendStatus(204);
  } catch (err) {
    console.error("LOGOUT_ERROR:", err);
    // Still clear cookie even on error
    clearRefreshCookie(res);
    return res.sendStatus(204);
  }
});
