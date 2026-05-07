import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { isTurnstileTrusted, TURNSTILE_TRUST_COOKIE_NAME } from "@/lib/turnstile-trust";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ? String(session.user.id) : null;
  if (!userId) {
    return NextResponse.json({ trusted: false });
  }

  const trusted = await isTurnstileTrusted({
    cookieValue: req.cookies.get(TURNSTILE_TRUST_COOKIE_NAME)?.value,
    userId,
  });

  return NextResponse.json({ trusted });
}

