import { NextResponse, type NextRequest } from "next/server";
import { rotateRefreshToken } from "@/lib/mobile-session";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const body = (await req.json()) as {
    refreshToken?: string;
    deviceId?: string;
  };
  const refreshToken =
    typeof body.refreshToken === "string" ? body.refreshToken.trim() : "";
  if (!refreshToken) {
    return NextResponse.json(
      { error: "Missing refreshToken." },
      { status: 400 },
    );
  }

  const ua = req.headers.get("user-agent");
  const next = await rotateRefreshToken({
    refreshToken,
    deviceId: typeof body.deviceId === "string" ? body.deviceId : undefined,
    userAgent: ua,
  });

  if (!next) {
    return NextResponse.json(
      { error: "Invalid or expired refresh." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    accessToken: next.accessToken,
    refreshToken: next.refreshToken,
    accessExpiresInSec: next.accessExpiresInSec,
    refreshExpiresAt: next.refreshExpiresAt,
    userId: next.userId,
  });
}
