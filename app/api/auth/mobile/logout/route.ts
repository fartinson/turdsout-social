import { NextResponse, type NextRequest } from "next/server";
import { revokeRefreshToken } from "@/lib/mobile-session";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const body = (await req.json()) as { refreshToken?: string };
  const refreshToken =
    typeof body.refreshToken === "string" ? body.refreshToken.trim() : "";
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  return NextResponse.json({ ok: true });
}
