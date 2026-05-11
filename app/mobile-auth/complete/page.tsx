import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createExchangeCode } from "@/lib/auth-exchange";
import { routes } from "@/lib/routes";

/**
 * After the user taps the magic link, NextAuth sets a session cookie and redirects here.
 * We mint a one-time code and open the native app via custom URL scheme (and/or show copy UI).
 */
export default async function MobileAuthCompletePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(routes.signIn);
  }

  const code = await createExchangeCode(String(session.user.id));
  const scheme = process.env.MOBILE_APP_URL_SCHEME ?? "turdsout";
  const deepLink = `${scheme}://auth/exchange?code=${encodeURIComponent(code)}`;

  redirect(deepLink);
}
