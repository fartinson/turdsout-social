import { NextResponse, type NextRequest } from "next/server";
import { consumeExchangeCode } from "@/lib/auth-exchange";
import { issueDeviceTokens } from "@/lib/mobile-session";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const body = (await req.json()) as {
    code?: string;
    deviceId?: string;
  };
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Missing code." }, { status: 400 });
  }

  const userId = await consumeExchangeCode(code);
  if (!userId) {
    return NextResponse.json(
      { error: "Invalid or expired code." },
      { status: 401 },
    );
  }

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
