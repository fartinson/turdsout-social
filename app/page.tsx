import { routes } from "@/lib/routes";
import { NewPostFab } from "@/components/NewPostFab";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faFire } from "@fortawesome/pro-solid-svg-icons";
import { Suspense } from "react";
import { FeedList } from "@/components/FeedList";
import { FeedSkeleton } from "@/components/FeedSkeleton";
import Link from "next/link";
import { auth } from "@/auth";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const sort = sp.sort === "new" ? ("new" as const) : ("top" as const);
  const session = await auth();
  const signedIn = Boolean(session?.user);
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <NewPostFab signedIn={false} />

      <section className="mt-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-foreground text-sm font-semibold">
            {sort === "new" ? "Recent" : "Trending"}
          </h2>

          <nav
            aria-label="Sort feed"
            className="border-border bg-background relative grid grid-cols-2 items-center rounded-xl border p-1 shadow-sm"
          >
            <div
              aria-hidden
              className={[
                "bg-primary pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg transition-transform duration-200 ease-out",
                sort === "new" ? "translate-x-full" : "translate-x-0",
              ].join(" ")}
            />
            <Link
              href={routes.home}
              aria-current={sort === "top" ? "page" : undefined}
              className={[
                "relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                sort === "top"
                  ? "text-primary-foreground"
                  : "text-foreground hover:bg-surface/60",
              ].join(" ")}
              title="Trending"
            >
              <FontAwesomeIcon icon={faFire} className="text-xs" />
              <span>Trending</span>
            </Link>

            <Link
              href={`${routes.home}?sort=new`}
              aria-current={sort === "new" ? "page" : undefined}
              className={[
                "relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                sort === "new"
                  ? "text-primary-foreground"
                  : "text-foreground hover:bg-surface/60",
              ].join(" ")}
              title="Recent"
            >
              <FontAwesomeIcon icon={faClock} className="text-xs" />
              <span>Recent</span>
            </Link>
          </nav>
        </div>
        <Suspense fallback={<FeedSkeleton />}>
          <FeedList sort={sort} />
        </Suspense>
      </section>
      {!signedIn ? (
        <section className="border-border bg-surface mt-6 rounded-2xl border border-dashed p-6 text-sm">
          <p className="text-foreground font-semibold">
            Got a better one? Let&apos;s hear it.
          </p>
          <p className="text-muted mt-1">Sign in to drop your own turd.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
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
          </div>
        </section>
      ) : (
        <section className="border-border bg-surface mt-6 rounded-2xl border border-dashed p-6 text-sm">
          <p className="text-foreground font-semibold">
            Got a better one? Let&apos;s hear it.
          </p>
          <p className="text-muted mt-1">Drop your own turd.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
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
          </div>
        </section>
      )}
    </main>
  );
}
