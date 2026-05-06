import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { connectMongoose } from "@/lib/mongoose";
import { UserProfile } from "@/models/UserProfile";
import { Post } from "@/models/Post";
import { routes } from "@/lib/routes";

export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const session = await auth();
  const { handle } = await params;
  const normalized = handle.trim().toLowerCase();
  if (!normalized) notFound();

  await connectMongoose();

  const profile = await UserProfile.findOne({ handle: normalized }).lean();
  if (!profile) notFound();

  const posts = await Post.find({ status: "live", authorUserId: String(profile.userId) })
    .sort("-_id")
    .limit(50)
    .lean();

  const isOwnProfile = Boolean(session?.user?.id && String(session.user.id) === String(profile.userId));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">@{profile.handle}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {posts.length} post{posts.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isOwnProfile ? (
            <Link
              href={routes.me}
              className="text-sm font-semibold text-zinc-700 hover:underline dark:text-zinc-300"
            >
              Edit profile
            </Link>
          ) : null}
          <Link href={routes.home} className="text-sm font-semibold text-zinc-700 hover:underline dark:text-zinc-300">
            Back to feed
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {posts.length ? (
          posts.map((p) => (
            <article
              key={String(p._id)}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="text-pretty text-base leading-7">{p.body}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                <span>{p.upvotes ?? 0} up</span>
                <span>·</span>
                <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}</span>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            Nothing posted yet.
          </div>
        )}
      </div>
    </main>
  );
}

