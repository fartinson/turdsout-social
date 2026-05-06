import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { UserProfile } from "@/models/UserProfile";
import { Vote } from "@/models/Vote";
import { Bookmark } from "@/models/Bookmark";
import { FeedCard } from "@/components/FeedCard";
import { routes } from "@/lib/routes";
import Link from "next/link";

function trunc(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return { title: "Post" };
  }
  await connectMongoose();

  const post = await Post.findOne({ _id: id, status: "live" }).lean();
  if (!post?.body) {
    return { title: "Post" };
  }

  const excerpt = trunc(post.body, 155);
  const title = trunc(post.body, 52);
  const path = routes.post(String(post._id));

  return {
    title,
    description: excerpt,
    openGraph: {
      title,
      description: excerpt,
      type: "article",
      url: path,
    },
    twitter: {
      card: "summary",
      description: excerpt,
      title,
    },
  };
}

export default async function PostPermalinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();
  await connectMongoose();

  const post = await Post.findOne({ _id: id, status: "live" }).lean();
  if (!post) notFound();

  const session = await auth();
  const viewerId = session?.user?.id ? String(session.user.id) : null;

  const profile = await UserProfile.findOne({
    userId: String(post.authorUserId),
  })
    .select({ userId: 1, handle: 1, avatarUrl: 1 })
    .lean();

  const author = profile
    ? {
        userId: String(profile.userId),
        handle: profile.handle ?? null,
        avatarUrl: profile.avatarUrl ?? null,
      }
    : { userId: String(post.authorUserId), handle: null, avatarUrl: null };

  let viewerVote: 1 | -1 | 0 = 0;
  let viewerBookmarked = false;

  if (viewerId) {
    const [v, b] = await Promise.all([
      Vote.findOne({ userId: viewerId, postId: post._id })
        .select({ value: 1 })
        .lean(),
      Bookmark.findOne({ userId: viewerId, postId: post._id })
        .select({ _id: 1 })
        .lean(),
    ]);
    if (v?.value === 1 || v?.value === -1) viewerVote = v.value;
    viewerBookmarked = Boolean(b);
  }

  const postIdStr = String(post._id);
  const created = post.createdAt
    ? new Date(post.createdAt).toISOString()
    : new Date().toISOString();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <FeedCard
        postId={postIdStr}
        body={post.body}
        createdAt={created}
        author={{ handle: author.handle, avatarUrl: author.avatarUrl }}
        signedIn={Boolean(session?.user)}
        initialUpvotes={post.upvotes ?? 0}
        initialDownvotes={post.downvotes ?? 0}
        initialVote={viewerVote}
        initialBookmarked={viewerBookmarked}
        showTime
      />

      {!session?.user ? (
        <div className="border-border bg-surface mt-6 rounded-2xl border border-dashed p-6 text-sm">
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
        </div>
      ) : null}
    </main>
  );
}
