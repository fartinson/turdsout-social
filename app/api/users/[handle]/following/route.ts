import { NextResponse, type NextRequest } from "next/server";
import { getApiUserId } from "@/lib/api-auth";
import {
  getFollowCountsMap,
  getViewerFollowSet,
  listFollowProfiles,
} from "@/lib/follow";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { UserProfile } from "@/models/UserProfile";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ handle: string }> },
) {
  const { handle: raw } = await context.params;
  const handle = (raw ?? "").trim().toLowerCase();
  if (!handle) {
    return NextResponse.json({ error: "Invalid handle." }, { status: 400 });
  }

  const viewerId = (await getApiUserId(req)) ?? null;
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20) || 20, 50);
  const cursor = url.searchParams.get("cursor");

  await connectMongoose();

  const profile = await UserProfile.findOne({ handle }).lean();
  if (!profile) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const targetUserId = String(profile.userId);
  const [countsMap, viewerFollowSet, list, turdCount] = await Promise.all([
    getFollowCountsMap([targetUserId]),
    getViewerFollowSet(viewerId, [targetUserId]),
    listFollowProfiles({
      subjectUserId: targetUserId,
      direction: "following",
      viewerUserId: viewerId,
      limit,
      cursor,
    }),
    Post.countDocuments({ status: "live", authorUserId: targetUserId }),
  ]);

  const counts = countsMap.get(targetUserId) ?? {
    followersCount: 0,
    followingCount: 0,
  };

  return NextResponse.json({
    profile: {
      userId: targetUserId,
      handle: profile.handle ?? null,
      displayName: profile.displayName ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      followersCount: counts.followersCount,
      followingCount: counts.followingCount,
      viewerFollows:
        viewerId !== targetUserId && viewerFollowSet.has(targetUserId),
      isSelf: viewerId === targetUserId,
      turdCount,
    },
    items: list.items,
    nextCursor: list.nextCursor,
  });
}
