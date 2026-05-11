import { NextResponse } from "next/server";
import { env } from "@/env";
import { connectMongoose } from "@/lib/mongoose";
import { hashToken } from "@/lib/mobile-tokens";
import { DeviceSession } from "@/models/DeviceSession";

const COOKIE_NAME = "ts_trust";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function base64url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

function base64urlToBytes(str: string) {
  return new Uint8Array(Buffer.from(str, "base64url"));
}

async function hmacSha256(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return new Uint8Array(sig);
}

type Payload = { uid: string; exp: number };

async function verifyCookieTrusted(
  cookieValue: string | undefined,
  userId: string,
) {
  if (!cookieValue) return false;
  if (!env.AUTH_SECRET) return false;

  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;

  let payload: Payload;
  try {
    payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as Payload;
  } catch {
    return false;
  }

  if (!payload?.uid || !payload?.exp) return false;
  if (payload.uid !== userId) return false;
  if (Date.now() > payload.exp) return false;

  const expectedSig = await hmacSha256(payloadB64, env.AUTH_SECRET);
  const actualSig = base64urlToBytes(sigB64);
  if (expectedSig.length !== actualSig.length) return false;

  let diff = 0;
  for (let i = 0; i < expectedSig.length; i++)
    diff |= expectedSig[i]! ^ actualSig[i]!;
  return diff === 0;
}

async function verifyMobileDeviceTrusted(opts: {
  refreshToken: string;
  userId: string;
  deviceId: string;
}) {
  const { refreshToken, userId, deviceId } = opts;
  await connectMongoose();
  const tokenHash = hashToken(refreshToken);
  const session = await DeviceSession.findOne({ tokenHash }).exec();
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now()
  ) {
    return false;
  }
  if (String(session.userId) !== userId) return false;
  if (!session.deviceId || String(session.deviceId) !== deviceId) return false;
  const until = session.turnstileTrustedUntil;
  if (!until || until.getTime() <= Date.now()) return false;
  return true;
}

export async function isTurnstileTrusted(opts: {
  cookieValue: string | undefined;
  userId: string;
  deviceIdHeader?: string | null;
  refreshToken?: string | null;
}) {
  const { cookieValue, userId, deviceIdHeader, refreshToken } = opts;

  if (await verifyCookieTrusted(cookieValue, userId)) return true;

  if (
    refreshToken &&
    deviceIdHeader &&
    (await verifyMobileDeviceTrusted({
      refreshToken,
      userId,
      deviceId: deviceIdHeader.trim(),
    }))
  ) {
    return true;
  }

  return false;
}

/** After a successful Turnstile verification on native, extend trust for that device session. */
export async function markDeviceTurnstileTrusted(opts: {
  refreshToken: string;
  userId: string;
  deviceId: string;
}) {
  const { refreshToken, userId, deviceId } = opts;
  await connectMongoose();
  const tokenHash = hashToken(refreshToken);
  const until = new Date(Date.now() + MAX_AGE_SECONDS * 1000);
  await DeviceSession.updateOne(
    {
      tokenHash,
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        deviceId: deviceId.trim().slice(0, 200),
        turnstileTrustedUntil: until,
      },
    },
  );
}

export async function setTurnstileTrustedCookie(
  res: NextResponse,
  userId: string,
) {
  if (!env.AUTH_SECRET) return;

  const payload: Payload = {
    uid: userId,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const sig = await hmacSha256(payloadB64, env.AUTH_SECRET);
  const value = `${payloadB64}.${base64url(sig)}`;

  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export const TURNSTILE_TRUST_COOKIE_NAME = COOKIE_NAME;
