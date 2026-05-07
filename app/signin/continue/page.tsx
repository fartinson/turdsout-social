import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/pro-regular-svg-icons";

export default async function ContinueSignInPage({
  searchParams,
}: {
  searchParams?: Promise<{
    token?: string;
    email?: string;
    callbackUrl?: string;
  }>;
}) {
  const sp = (await searchParams) ?? {};
  const token = sp.token ?? "";
  const email = sp.email ?? "";
  const callbackUrl = sp.callbackUrl ?? routes.home;

  if (!token || !email) {
    redirect(routes.signIn);
  }

  async function continueSignIn() {
    "use server";
    const url = new URL("/api/auth/callback/resend", "http://localhost");
    url.searchParams.set("token", token);
    url.searchParams.set("email", email);
    url.searchParams.set("callbackUrl", callbackUrl);
    redirect(url.pathname + url.search);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        Welcome Back!
      </h1>
      <p className="text-muted mt-3 text-sm text-pretty">
        Continue to finish signing in to Turdsout.
      </p>

      <form action={continueSignIn} className="mt-10">
        <button
          type="submit"
          className="bg-primary text-primary-foreground inline-flex w-full cursor-pointer items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
        >
          Continue <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </form>

      <p className="text-muted mt-6 text-xs">
        Didn&apos;t request this? You can close this tab.
      </p>
    </main>
  );
}
