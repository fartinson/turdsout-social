import { NextResponse, type NextRequest } from "next/server";
import { getApiUserId } from "@/lib/api-auth";
import { buildMentionsJson, toFeedItemJson } from "@/lib/json-feed-post";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { UserProfile } from "@/models/UserProfile";
import { Vote } from "@/models/Vote";
import { Bookmark } from "@/models/Bookmark";
import { getFollowCountsMap, getViewerFollowSet } from "@/lib/follow";
import { loadMentionProfilesMap } from "@/lib/post-mentions";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ handle: string }> },
) {
  const { handle: raw } = await context.params;
  const handleKey = (raw ?? "").trim().toLowerCase();
  if (!handleKey) {
    return NextResponse.json({ error: "Invalid handle." }, { status: 400 });
  }

  const viewerId = (await getApiUserId(req)) ?? null;

  await connectMongoose();
  const profile = await UserProfile.findOne({
    handle: handleKey,
  }).lean();

  if (!profile) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20) || 20, 50);
  const cursor = url.searchParams.get("cursor");

  const baseQuery: Record<string, unknown> = {
    status: "live",
    authorUserId: String(profile.userId),
  };
  if (cursor && /^[a-f0-9]{24}$/i.test(cursor)) {
    baseQuery._id = { $lt: cursor };
  }

  const posts = await Post.find(baseQuery)
    .sort("-_id")
    .limit(limit + 1)
    .lean();

  const nextCursor =
    posts.length > limit ? String(posts[limit - 1]?._id) : null;
  const pagePosts = posts.slice(0, limit);
  const postIds = pagePosts.map((p) => p._id);

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

  const author = {
    userId: String(profile.userId),
    handle: profile.handle ?? null,
    avatarUrl: profile.avatarUrl ?? null,
  };

  const [countsMap, viewerFollowSet] = await Promise.all([
    getFollowCountsMap([String(profile.userId)]),
    getViewerFollowSet(viewerId, [String(profile.userId)]),
  ]);
  const counts = countsMap.get(String(profile.userId)) ?? {
    followersCount: 0,
    followingCount: 0,
  };

  const mentionUserIds = [
    ...new Set(
      pagePosts.flatMap((p) => {
        const m = p.mentionedUserIds;
        return Array.isArray(m) ? m.map((id: unknown) => String(id)) : [];
      }),
    ),
  ];
  const mentionProfilesById = await loadMentionProfilesMap(mentionUserIds);

  const items = pagePosts.map((p) =>
    toFeedItemJson(
      p,
      author,
      viewerId ? (voteByPostId.get(String(p._id)) ?? 0) : 0,
      viewerId ? bookmarkByPostId.has(String(p._id)) : false,
      buildMentionsJson(
        Array.isArray(p.mentionedUserIds) ? p.mentionedUserIds : [],
        mentionProfilesById,
      ),
    ),
  );

  return NextResponse.json({
    profile: {
      userId: String(profile.userId),
      handle: profile.handle ?? null,
      displayName: profile.displayName ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      followersCount: counts.followersCount,
      followingCount: counts.followingCount,
      viewerFollows:
        viewerId !== String(profile.userId) &&
        viewerFollowSet.has(String(profile.userId)),
      isSelf: viewerId === String(profile.userId),
      turdCount: await Post.countDocuments({
        status: "live",
        authorUserId: String(profile.userId),
      }),
    },
    items,
    nextCursor,
  });
}
