import { NextResponse, type NextRequest } from "next/server";
import { getApiUserId } from "@/lib/api-auth";
import {
  isTurnstileTrusted,
  TURNSTILE_TRUST_COOKIE_NAME,
} from "@/lib/turnstile-trust";

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) {
    return NextResponse.json({ trusted: false });
  }

  const trusted = await isTurnstileTrusted({
    cookieValue: req.cookies.get(TURNSTILE_TRUST_COOKIE_NAME)?.value,
    userId,
    deviceIdHeader: req.headers.get("x-turdsout-device-id"),
    refreshToken: null,
  });

  return NextResponse.json({ trusted });
}
