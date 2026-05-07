import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { connectMongoose } from "@/lib/mongoose";
import { UserProfile } from "@/models/UserProfile";
import { Post } from "@/models/Post";
import { routes } from "@/lib/routes";
import { Vote } from "@/models/Vote";
import { Bookmark } from "@/models/Bookmark";
import { FeedCard } from "@/components/FeedCard";
import { Avatar } from "@/components/Avatar";
import { FeedPostInviteCard } from "@/components/FeedPostInviteCard";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const session = await auth();
  const viewerId = session?.user?.id ? String(session.user.id) : null;
  const { handle } = await params;
  const normalized = handle.trim().toLowerCase();
  if (!normalized) notFound();

  await connectMongoose();

  const profile = await UserProfile.findOne({ handle: normalized }).lean();
  if (!profile) notFound();

  const posts = await Post.find({
    status: "live",
    authorUserId: String(profile.userId),
  })
    .sort("-_id")
    .limit(50)
    .lean();

  const isOwnProfile = Boolean(
    session?.user?.id && String(session.user.id) === String(profile.userId),
  );

  const postIds = posts.map((p) => p._id);
  const voteByPostId = new Map<string, 1 | -1>();
  const bookmarkByPostId = new Set<string>();

  if (viewerId && postIds.length) {
    const [votes, bookmarks] = await Promise.all([
      Vote.find({ userId: viewerId, postId: { $in: postIds } })
        .select({ postId: 1, value: 1 })
        .lean(),
      Bookmark.find({ userId: viewerId, postId: { $in: postIds } })
        .select({ postId: 1 })
        .lean(),
    ]);
    for (const v of votes) {
      const id = String(v.postId);
      if (v.value === 1 || v.value === -1) voteByPostId.set(id, v.value);
    }
    for (const b of bookmarks) bookmarkByPostId.add(String(b.postId));
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            src={profile.avatarUrl ?? null}
            name={profile.handle ? `@${profile.handle}` : "Profile"}
            size={64}
            className="bg-background"
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              @{profile.handle}
            </h1>
            <p className="text-muted mt-1 text-sm">
              {posts.length} post{posts.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isOwnProfile ? (
            <Link
              href={routes.me}
              className="text-foreground text-sm font-semibold hover:underline"
            >
              Edit profile
            </Link>
          ) : null}
          <Link
            href={routes.home}
            className="text-foreground text-sm font-semibold hover:underline"
          >
            Back to feed
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {posts.length ? (
          posts.map((p) => (
            <FeedCard
              key={String(p._id)}
              postId={String(p._id)}
              body={p.body}
              createdAt={
                p.createdAt?.toISOString?.() ?? new Date().toISOString()
              }
              author={{
                handle: profile.handle ?? null,
                avatarUrl: profile.avatarUrl ?? null,
              }}
              signedIn={Boolean(session?.user)}
              initialUpvotes={p.upvotes ?? 0}
              initialDownvotes={p.downvotes ?? 0}
              initialVote={voteByPostId.get(String(p._id)) ?? 0}
              initialBookmarked={bookmarkByPostId.has(String(p._id))}
            />
          ))
        ) : (
          <div className="border-border bg-surface text-muted rounded-2xl border border-dashed p-6 text-sm">
            Nothing posted yet.
          </div>
        )}
      </div>
      <FeedPostInviteCard signedIn={Boolean(session?.user)} />
    </main>
  );
}
