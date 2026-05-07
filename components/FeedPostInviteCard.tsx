import Link from "next/link";
import { routes } from "@/lib/routes";

type Props = {
  signedIn: boolean;
};

export function FeedPostInviteCard({ signedIn }: Props) {
  return (
    <section className="border-border bg-surface mt-6 rounded-2xl border border-dashed p-6 text-sm">
      <p className="text-foreground font-semibold">
        Got a better one? Let&apos;s hear it.
      </p>
      <p className="text-muted mt-1">
        {signedIn ? "Drop your own turd." : "Sign in to drop your own turd."}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {signedIn ? (
          <>
            <Link
              href={routes.newPost}
              className="bg-primary text-primary-foreground cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90"
            >
              Make a Turd
            </Link>
            <Link
              href={routes.newPost}
              className="text-foreground cursor-pointer text-sm font-semibold hover:underline"
            >
              Create your next turd →
            </Link>
          </>
        ) : (
          <>
            <Link
              href={routes.signIn}
              className="bg-primary text-primary-foreground cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90"
            >
              Sign in
            </Link>
            <Link
              href={routes.signIn}
              className="text-foreground cursor-pointer text-sm font-semibold hover:underline"
            >
              Create your first turd →
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
