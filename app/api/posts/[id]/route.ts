import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { getApiUserId } from "@/lib/api-auth";
import { toFeedItemJson } from "@/lib/json-feed-post";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { UserProfile } from "@/models/UserProfile";
import { Vote } from "@/models/Vote";
import { Bookmark } from "@/models/Bookmark";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id || !isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const viewerId = (await getApiUserId(req)) ?? null;

  await connectMongoose();
  const post = await Post.findOne({ _id: id, status: "live" }).lean();
  if (!post) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

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
    : {
        userId: String(post.authorUserId),
        handle: null,
        avatarUrl: null,
      };

  let viewerVote: 1 | -1 | 0 = 0;
  let viewerBookmarked = false;
  if (viewerId) {
    const [vote, bm] = await Promise.all([
      Vote.findOne({ userId: viewerId, postId: post._id })
        .select({ value: 1 })
        .lean(),
      Bookmark.findOne({ userId: viewerId, postId: post._id })
        .select({ _id: 1 })
        .lean(),
    ]);
    if (vote?.value === 1 || vote?.value === -1) viewerVote = vote.value;
    viewerBookmarked = Boolean(bm);
  }

  const item = toFeedItemJson(post, author, viewerVote, viewerBookmarked);
  return NextResponse.json({ post: item });
}
