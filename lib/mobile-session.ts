import { connectMongoose } from "@/lib/mongoose";
import { DeviceSession } from "@/models/DeviceSession";
import {
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from "@/lib/mobile-tokens";

const REFRESH_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  accessExpiresInSec: number;
  refreshExpiresAt: string;
  userId: string;
};

export async function issueDeviceTokens(opts: {
  userId: string;
  deviceId?: string | null;
  userAgent?: string | null;
}): Promise<IssuedTokens | null> {
  await connectMongoose();

  const rawRefresh = generateRefreshToken();
  const tokenHash = hashToken(rawRefresh);
  const expiresAt = new Date(Date.now() + REFRESH_MS);

  await DeviceSession.create({
    userId: opts.userId,
    tokenHash,
    expiresAt,
    deviceId: opts.deviceId?.trim() || undefined,
    userAgent: opts.userAgent?.slice(0, 500) || undefined,
  });

  const accessToken = await signAccessToken(opts.userId);
  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken: rawRefresh,
    accessExpiresInSec: 15 * 60,
    refreshExpiresAt: expiresAt.toISOString(),
    userId: opts.userId,
  };
}

/** Validates refresh token, rotates session, returns new pair. */
export async function rotateRefreshToken(opts: {
  refreshToken: string;
  deviceId?: string | null;
  userAgent?: string | null;
}): Promise<IssuedTokens | null> {
  await connectMongoose();
  const tokenHash = hashToken(opts.refreshToken);

  const existing = await DeviceSession.findOne({ tokenHash }).exec();
  if (
    !existing ||
    existing.revokedAt ||
    existing.expiresAt.getTime() <= Date.now()
  ) {
    return null;
  }

  const userId = String(existing.userId);

  existing.revokedAt = new Date();
  await existing.save();

  return issueDeviceTokens({
    userId,
    deviceId: opts.deviceId ?? existing.deviceId ?? undefined,
    userAgent: opts.userAgent,
  });
}

export async function revokeRefreshToken(rawRefresh: string): Promise<boolean> {
  await connectMongoose();
  const tokenHash = hashToken(rawRefresh);
  const res = await DeviceSession.updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
  return res.modifiedCount > 0;
}
