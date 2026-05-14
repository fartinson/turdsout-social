import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { getApiUserId } from "@/lib/api-auth";
import { buildMentionsJson, toFeedItemJson } from "@/lib/json-feed-post";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { Reply } from "@/models/Reply";
import { UserProfile } from "@/models/UserProfile";
import { Vote } from "@/models/Vote";
import { Bookmark } from "@/models/Bookmark";
import { loadMentionProfilesMap } from "@/lib/post-mentions";

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

  const mentionIds = Array.isArray(post.mentionedUserIds)
    ? post.mentionedUserIds.map((id: unknown) => String(id))
    : [];
  const mentionProfilesById = await loadMentionProfilesMap(mentionIds);

  const actualReplyCount = await Reply.countDocuments({
    postId: post._id,
    status: { $ne: "hidden" },
  });
  if ((post.replyCount ?? 0) !== actualReplyCount) {
    void Post.updateOne({ _id: post._id }, { $set: { replyCount: actualReplyCount } });
  }

  const item = toFeedItemJson(
    { ...post, replyCount: actualReplyCount },
    author,
    viewerVote,
    viewerBookmarked,
    buildMentionsJson(post.mentionedUserIds, mentionProfilesById),
  );
  return NextResponse.json({ post: item });
}
