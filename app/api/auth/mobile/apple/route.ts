import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";
import { verifyAppleIdentityToken } from "@/lib/apple-verify";
import { ensureAppleLinkedUser } from "@/lib/ensure-apple-account";
import { issueDeviceTokens } from "@/lib/mobile-session";
import { rateLimiters } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  if (!env.APPLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "APPLE_CLIENT_ID is not configured." },
      { status: 501 },
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const limiter = rateLimiters.authEmail;
  if (limiter) {
    const rl = await limiter.limit(`apple:${ip ?? "noip"}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Slow down." }, { status: 429 });
    }
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const body = (await req.json()) as {
    identityToken?: string;
    deviceId?: string;
  };
  const identityToken =
    typeof body.identityToken === "string" ? body.identityToken.trim() : "";
  if (!identityToken) {
    return NextResponse.json(
      { error: "Missing identityToken." },
      { status: 400 },
    );
  }

  let sub: string;
  let email: string | undefined;
  try {
    const p = await verifyAppleIdentityToken(
      identityToken,
      env.APPLE_CLIENT_ID,
    );
    sub = p.sub;
    email = p.email;
  } catch {
    return NextResponse.json(
      { error: "Invalid Apple identity token." },
      { status: 401 },
    );
  }

  const userId = await ensureAppleLinkedUser({
    appleSub: sub,
    emailFromApple: email,
  });

  const ua = req.headers.get("user-agent");
  const tokens = await issueDeviceTokens({
    userId,
    deviceId: typeof body.deviceId === "string" ? body.deviceId : undefined,
    userAgent: ua,
  });

  if (!tokens) {
    return NextResponse.json(
      {
        error:
          "Token issuance failed. Set MOBILE_JWT_SECRET or AUTH_SECRET on the server.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessExpiresInSec: tokens.accessExpiresInSec,
    refreshExpiresAt: tokens.refreshExpiresAt,
    userId,
  });
}
