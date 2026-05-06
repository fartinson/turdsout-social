import Link from "next/link";
import { auth, signOut } from "@/auth";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { UserProfile } from "@/models/UserProfile";
import { routes } from "@/lib/routes";
import { Vote } from "@/models/Vote";
import { Bookmark } from "@/models/Bookmark";
import { FeedPostEngagement } from "@/components/FeedPostEngagement";

type FeedItem = {
  id: string;
  body: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author: { userId: string; handle: string | null };
  viewerVote: 1 | -1 | 0;
  viewerBookmarked: boolean;
};

async function getFeed(sort: "top" | "new", viewerUserId: string | null) {
  await connectMongoose();
  const sortSpec = sort === "new" ? "-_id" : "-upvotes -_id";
  const posts = await Post.find({ status: "live" }).sort(sortSpec).limit(20).lean();

  const authorUserIds = Array.from(new Set(posts.map((p) => String(p.authorUserId)).filter(Boolean)));
  const profiles = await UserProfile.find({ userId: { $in: authorUserIds } })
    .select({ userId: 1, handle: 1 })
    .lean();
  const profileById = new Map<string, { userId: string; handle: string | null }>(
    profiles.map((p) => [String(p.userId), { userId: String(p.userId), handle: p.handle ?? null }])
  );

  const postIds = posts.map((p) => p._id);
  const voteByPostId = new Map<string, 1 | -1>();
  const bookmarkByPostId = new Set<string>();

  if (viewerUserId && postIds.length) {
    const [votes, bookmarks] = await Promise.all([
      Vote.find({ userId: viewerUserId, postId: { $in: postIds } })
        .select({ postId: 1, value: 1 })
        .lean(),
      Bookmark.find({ userId: viewerUserId, postId: { $in: postIds } })
        .select({ postId: 1 })
        .lean(),
    ]);
    for (const v of votes) {
      const id = String(v.postId);
      if (v.value === 1 || v.value === -1) voteByPostId.set(id, v.value);
    }
    for (const b of bookmarks) bookmarkByPostId.add(String(b.postId));
  }

  return {
    items: posts.map((p) => ({
      id: String(p._id),
      body: p.body,
      upvotes: p.upvotes ?? 0,
      downvotes: p.downvotes ?? 0,
      createdAt: p.createdAt?.toISOString?.() ?? new Date().toISOString(),
      author: profileById.get(String(p.authorUserId)) ?? { userId: String(p.authorUserId), handle: null },
      viewerVote: voteByPostId.get(String(p._id)) ?? 0,
      viewerBookmarked: bookmarkByPostId.has(String(p._id)),
    })),
  } as { items: FeedItem[] };
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string }>;
}) {
  const session = await auth();
  const sp = (await searchParams) ?? {};
  const sort = sp.sort === "new" ? ("new" as const) : ("top" as const);
  const viewerId = session?.user?.id ? String(session.user.id) : null;
  const feed = await getFeed(sort, viewerId);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-black/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Turdsout
          </Link>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                  Sign out
                </button>
              </form>
            ) : (
              <Link
                href={routes.signIn}
                className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-balance text-4xl font-semibold tracking-tight">Turdsout…</h1>
          <p className="mt-3 max-w-2xl text-pretty text-sm text-zinc-600 dark:text-zinc-400">
            Post your best “Turdsout I ___” moments. The feed sorts itself based on what people actually react to.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {session?.user ? (
              <Link
                href={routes.newPost}
                className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Write one
              </Link>
            ) : (
              <Link
                href={routes.signIn}
                className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Sign in to post
              </Link>
            )}
            <Link
              href={`${routes.home}?sort=new`}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              New
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {sort === "new" ? "New" : "Top right now"}
          </h2>
          <div className="mt-4 space-y-3">
            {feed.items.length ? (
              feed.items.map((p) => (
                <article
                  key={p.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="text-pretty text-base leading-7">{p.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    {p.author.handle ? (
                      <Link
                        href={routes.userProfile(p.author.handle)}
                        className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                      >
                        @{p.author.handle}
                      </Link>
                    ) : (
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Anonymous Turd</span>
                    )}
                    <span>·</span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <FeedPostEngagement
                    postId={p.id}
                    signedIn={Boolean(session?.user)}
                    initialUpvotes={p.upvotes}
                    initialDownvotes={p.downvotes}
                    initialVote={p.viewerVote}
                    initialBookmarked={p.viewerBookmarked}
                  />
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                Nothing yet. The first Turdsout is the hardest.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
