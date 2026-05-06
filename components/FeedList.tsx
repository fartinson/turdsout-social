import { auth } from "@/auth";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { UserProfile } from "@/models/UserProfile";
import { Vote } from "@/models/Vote";
import { Bookmark } from "@/models/Bookmark";
import { FeedCard } from "@/components/FeedCard";

type FeedItem = {
  id: string;
  body: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author: { userId: string; handle: string | null; avatarUrl: string | null };
  viewerVote: 1 | -1 | 0;
  viewerBookmarked: boolean;
};

async function getFeed(sort: "top" | "new", viewerUserId: string | null) {
  await connectMongoose();
  const sortSpec = sort === "new" ? "-_id" : "-upvotes -_id";
  const posts = await Post.find({ status: "live" }).sort(sortSpec).limit(20).lean();

  const authorUserIds = Array.from(new Set(posts.map((p) => String(p.authorUserId)).filter(Boolean)));
  const profiles = await UserProfile.find({ userId: { $in: authorUserIds } })
    .select({ userId: 1, handle: 1, avatarUrl: 1 })
    .lean();
  const profileById = new Map<string, { userId: string; handle: string | null; avatarUrl: string | null }>(
    profiles.map((p) => [
      String(p.userId),
      { userId: String(p.userId), handle: p.handle ?? null, avatarUrl: p.avatarUrl ?? null },
    ])
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
      author:
        profileById.get(String(p.authorUserId)) ?? { userId: String(p.authorUserId), handle: null, avatarUrl: null },
      viewerVote: voteByPostId.get(String(p._id)) ?? 0,
      viewerBookmarked: bookmarkByPostId.has(String(p._id)),
    })),
  } as { items: FeedItem[] };
}

export async function FeedList({ sort }: { sort: "top" | "new" }) {
  const session = await auth();
  const viewerId = session?.user?.id ? String(session.user.id) : null;
  const feed = await getFeed(sort, viewerId);

  if (!feed.items.length) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted">
        Nothing yet. The first Turdsout is the hardest.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {feed.items.map((p) => (
        <FeedCard
          key={p.id}
          postId={p.id}
          body={p.body}
          createdAt={p.createdAt}
          author={{ handle: p.author.handle, avatarUrl: p.author.avatarUrl }}
          signedIn={Boolean(session?.user)}
          initialUpvotes={p.upvotes}
          initialDownvotes={p.downvotes}
          initialVote={p.viewerVote}
          initialBookmarked={p.viewerBookmarked}
        />
      ))}
    </div>
  );
}

