import { randomBytes } from "crypto";
import { connectMongoose } from "@/lib/mongoose";
import { AuthExchangeCode } from "@/models/AuthExchangeCode";
import { hashToken } from "@/lib/mobile-tokens";

const TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function createExchangeCode(userId: string): Promise<string> {
  await connectMongoose();
  const raw = randomBytes(32).toString("base64url");
  const codeHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + TTL_MS);
  await AuthExchangeCode.create({ codeHash, userId, expiresAt });
  return raw;
}

/** Returns user id if valid single-use code, else null. */
export async function consumeExchangeCode(raw: string): Promise<string | null> {
  await connectMongoose();
  const codeHash = hashToken(raw.trim());
  const doc = await AuthExchangeCode.findOne({
    codeHash,
    usedAt: null,
  }).exec();
  if (!doc || doc.expiresAt.getTime() <= Date.now()) return null;
  doc.usedAt = new Date();
  await doc.save();
  return String(doc.userId);
}
