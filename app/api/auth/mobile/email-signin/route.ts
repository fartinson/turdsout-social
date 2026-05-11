import { NextResponse, type NextRequest } from "next/server";
import { signIn } from "@/auth";
import { env } from "@/env";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { rateLimiters } from "@/lib/ratelimit";

const hasAuthEnv = Boolean(
  env.AUTH_SECRET && env.AUTH_RESEND_KEY && env.AUTH_EMAIL_FROM,
);

export async function POST(req: NextRequest) {
  if (!hasAuthEnv) {
    return NextResponse.json(
      {
        error:
          "Auth email is not configured. Set AUTH_SECRET, AUTH_RESEND_KEY, and AUTH_EMAIL_FROM.",
      },
      { status: 500 },
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const limiter = rateLimiters.authEmail;
  if (limiter) {
    const rl = await limiter.limit(`mobile_email:${ip ?? "noip"}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Slow down." }, { status: 429 });
    }
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const body = (await req.json()) as { email?: string };
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const redirectTo = `${getAppBaseUrl()}/mobile-auth/complete`;

  try {
    await signIn("resend", {
      email,
      redirect: false,
      redirectTo,
      callbackUrl: redirectTo,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not send sign-in email." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Check your email for a sign-in link.",
  });
}
