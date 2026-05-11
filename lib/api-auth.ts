import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { verifyAccessToken } from "@/lib/mobile-tokens";

/**
 * Resolves the current user id from NextAuth session cookies or
 * `Authorization: Bearer <access JWT>` (native apps).
 */
export async function getApiUserId(req: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return String(session.user.id);

  const authz = req.headers.get("authorization");
  if (!authz?.toLowerCase().startsWith("bearer ")) return null;
  const token = authz.slice(7).trim();
  if (!token) return null;

  return verifyAccessToken(token);
}
