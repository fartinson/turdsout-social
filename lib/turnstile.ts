import { env } from "@/env";

export async function verifyTurnstileToken(token: string | null | undefined, ip?: string | null) {
  // We only enforce Turnstile in production.
  if (process.env.NODE_ENV !== "production" || !env.TURNSTILE_SECRET_KEY) {
    return { ok: true as const, skipped: true as const };
  }

  if (!token) return { ok: false as const, reason: "Missing Turnstile token." };

  const formData = new FormData();
  formData.append("secret", env.TURNSTILE_SECRET_KEY);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) return { ok: false as const, reason: "Turnstile verification failed." };
  const data = (await res.json()) as { success?: boolean };
  if (!data.success) return { ok: false as const, reason: "Turnstile rejected." };

  return { ok: true as const, skipped: false as const };
}

