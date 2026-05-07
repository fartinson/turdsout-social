import { routes } from "@/lib/routes";
import { NewPostFab } from "@/components/NewPostFab";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faFire,
  faInfoCircle,
} from "@fortawesome/pro-solid-svg-icons";
import { Suspense } from "react";
import { FeedList } from "@/components/FeedList";
import { FeedSkeleton } from "@/components/FeedSkeleton";
import { FeedPostInviteCard } from "@/components/FeedPostInviteCard";
import Link from "next/link";
import { auth } from "@/auth";
import { cn } from "@/lib/cn";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const sort = sp.sort === "new" ? ("new" as const) : ("top" as const);
  const session = await auth();
  const signedIn = Boolean(session?.user);
  console.log("signedIn", signedIn);
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <NewPostFab signedIn={signedIn} />

      <section className="mt-2">
        <div className="flex items-center justify-between gap-4">
          <nav
            aria-label="Sort feed"
            className="border-border bg-background relative grid grid-cols-2 items-center rounded-xl border p-1 shadow-sm"
          >
            <div
              aria-hidden
              className={cn(
                "bg-primary pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg transition-transform duration-200 ease-out",
                sort === "new" ? "translate-x-full" : "translate-x-0",
              )}
            />
            <Link
              href={routes.home}
              aria-current={sort === "top" ? "page" : undefined}
              className={cn(
                "relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                sort === "top"
                  ? "text-primary-foreground"
                  : "text-foreground hover:bg-surface/60",
              )}
              title="Trending"
            >
              <FontAwesomeIcon icon={faFire} className="xs:text-base text-sm" />
              <span className="xs:inline hidden">Trending</span>
            </Link>

            <Link
              href={`${routes.home}?sort=new`}
              aria-current={sort === "new" ? "page" : undefined}
              className={cn(
                "relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                sort === "new"
                  ? "text-primary-foreground"
                  : "text-foreground hover:bg-surface/60",
              )}
              title="Recent"
            >
              <FontAwesomeIcon
                icon={faClock}
                className="xs:text-base text-sm"
              />
              <span className="xs:inline hidden">Recent</span>
            </Link>
          </nav>
          <Link
            href={routes.page("what-is-turdsout")}
            className="inline-flex shrink-0 items-center gap-1 font-semibold"
          >
            <FontAwesomeIcon icon={faInfoCircle} />
            <span>
              What is <span className="font-header">Turdsout</span>?
            </span>
          </Link>
        </div>
        <Suspense fallback={<FeedSkeleton />}>
          <FeedList sort={sort} />
        </Suspense>
      </section>
      <FeedPostInviteCard signedIn={signedIn} />
    </main>
  );
}
