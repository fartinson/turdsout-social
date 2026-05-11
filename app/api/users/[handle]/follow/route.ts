import { NextResponse, type NextRequest } from "next/server";
import { getApiUserId } from "@/lib/api-auth";
import { connectMongoose } from "@/lib/mongoose";
import { getFollowCountsMap, followUser, unfollowUser } from "@/lib/follow";
import { UserProfile } from "@/models/UserProfile";

async function resolveTargetProfile(rawHandle: string) {
  const handle = (rawHandle ?? "").trim().toLowerCase();
  if (!handle) {
    return null;
  }

  return UserProfile.findOne({ handle }).lean();
}

async function buildResponse(targetUserId: string, viewerFollows: boolean) {
  const counts = (await getFollowCountsMap([targetUserId])).get(targetUserId) ?? {
    followersCount: 0,
    followingCount: 0,
  };

  return NextResponse.json({
    viewerFollows,
    followersCount: counts.followersCount,
    followingCount: counts.followingCount,
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ handle: string }> },
) {
  const viewerUserId = await getApiUserId(req);
  if (!viewerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { handle } = await context.params;

  await connectMongoose();
  const targetProfile = await resolveTargetProfile(handle);
  if (!targetProfile) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const targetUserId = String(targetProfile.userId);
  if (targetUserId === viewerUserId) {
    return NextResponse.json(
      { error: "You cannot follow yourself." },
      { status: 400 },
    );
  }

  await followUser(viewerUserId, targetUserId);
  return buildResponse(targetUserId, true);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ handle: string }> },
) {
  const viewerUserId = await getApiUserId(req);
  if (!viewerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { handle } = await context.params;

  await connectMongoose();
  const targetProfile = await resolveTargetProfile(handle);
  if (!targetProfile) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const targetUserId = String(targetProfile.userId);
  if (targetUserId === viewerUserId) {
    return NextResponse.json(
      { error: "You cannot unfollow yourself." },
      { status: 400 },
    );
  }

  await unfollowUser(viewerUserId, targetUserId);
  return buildResponse(targetUserId, false);
}
