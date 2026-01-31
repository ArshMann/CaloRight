import { sign, verify, type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing`);
  return v;
}

const ACCESS_SECRET: Secret = mustGetEnv("JWT_ACCESS_SECRET");
const REFRESH_SECRET: Secret = mustGetEnv("JWT_REFRESH_SECRET");
const ACCESS_EXPIRES_IN = mustGetEnv("JWT_ACCESS_EXPIRES_IN");
const REFRESH_EXPIRES_IN = mustGetEnv("JWT_REFRESH_EXPIRES_IN");
const accessSignOptions: SignOptions = { expiresIn: ACCESS_EXPIRES_IN as any };
const refreshSignOptions: SignOptions = { expiresIn: REFRESH_EXPIRES_IN as any };

export function signAccessToken(userId: string) {
  return sign({ sub: userId }, ACCESS_SECRET, accessSignOptions);
}

export function signRefreshToken(userId: string) {
  const jti = randomBytes(16).toString("hex");
  return sign({ sub: userId, jti }, REFRESH_SECRET, refreshSignOptions);
}

export function verifyRefreshToken(token: string): { userId: string; jti: string } {
  const payload = verify(token, REFRESH_SECRET) as JwtPayload;

  const userId = payload.sub;
  const jti = payload.jti;

  if (typeof userId !== "string" || typeof jti !== "string") {
    throw new Error("Invalid refresh token payload");
  }
  return { userId, jti };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
