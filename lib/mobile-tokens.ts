import { createHash, randomBytes } from "crypto";
import * as jose from "jose";
import { env } from "@/env";

const JWT_ISSUER = "turdsout";
const JWT_AUDIENCE = "turdsout-mobile";

function getJwtSecret(): Uint8Array | null {
  const s = env.MOBILE_JWT_SECRET ?? env.AUTH_SECRET;
  if (!s) return null;
  return new TextEncoder().encode(s);
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export async function signAccessToken(userId: string): Promise<string | null> {
  const secret = getJwtSecret();
  if (!secret) return null;

  return new jose.SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .sign(secret);
}

export async function verifyAccessToken(
  token: string,
): Promise<string | null> {
  const secret = getJwtSecret();
  if (!secret) return null;

  try {
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}
