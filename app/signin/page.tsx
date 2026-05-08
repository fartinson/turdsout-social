import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { TurnstileInput } from "@/components/TurnstileInput";
import { SignInSubmitButton } from "@/components/SignInSubmitButton";
import { env } from "@/env";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { routes } from "@/lib/routes";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect(routes.home);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        Sign in to Turdsout
      </h1>
      <p className="text-muted mt-3 text-sm text-pretty">
        We&apos;re trying to keep Turdsout bot-free and as human as poosible, so
        you need to sign in with your email. Maximum middle-school energy.
      </p>

      <form
        className="mt-10 space-y-4"
        action={async (formData) => {
          "use server";
          if (
            process.env.NODE_ENV === "production" &&
            env.TURNSTILE_SECRET_KEY
          ) {
            const token = formData.get("turnstileToken");
            const verified = await verifyTurnstileToken(
              typeof token === "string" ? token : undefined,
            );
            if (!verified.ok) {
              return;
            }
          }
          await signIn("resend", formData);
        }}
      >
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            className="border-border bg-background focus:border-border/70 mt-2 w-full rounded-xl border px-4 py-3 text-base ring-0 transition outline-none"
            placeholder="you@turdsout.com"
          />
        </label>

        <SignInSubmitButton />

        <TurnstileInput name="turnstileToken" />
      </form>

      <p className="text-muted mt-6 text-xs">
        By continuing, you agree to receive a sign-in email. You can unsubscribe
        from non-auth emails anytime (we won’t send any).
      </p>
    </main>
  );
}
