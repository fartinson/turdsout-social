import { Follow } from "@/models/Follow";
import { UserProfile } from "@/models/UserProfile";

export type FollowCounts = {
  followersCount: number;
  followingCount: number;
};

export type FollowListItemJson = {
  userId: string;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  viewerFollows: boolean;
  isSelf: boolean;
};

export async function followUser(
  followerUserId: string,
  followedUserId: string,
) {
  if (followerUserId === followedUserId) {
    throw new Error("Users cannot follow themselves.");
  }

  await Follow.updateOne(
    { followerUserId, followedUserId },
    { $setOnInsert: { followerUserId, followedUserId } },
    { upsert: true },
  );
}

export async function unfollowUser(
  followerUserId: string,
  followedUserId: string,
) {
  await Follow.deleteOne({ followerUserId, followedUserId });
}

export async function getFollowCountsMap(userIds: string[]) {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  const counts = new Map<string, FollowCounts>();

  if (!ids.length) {
    return counts;
  }

  const [followers, following] = await Promise.all([
    Follow.aggregate<{ _id: string; count: number }>([
      { $match: { followedUserId: { $in: ids } } },
      { $group: { _id: "$followedUserId", count: { $sum: 1 } } },
    ]),
    Follow.aggregate<{ _id: string; count: number }>([
      { $match: { followerUserId: { $in: ids } } },
      { $group: { _id: "$followerUserId", count: { $sum: 1 } } },
    ]),
  ]);

  for (const userId of ids) {
    counts.set(userId, { followersCount: 0, followingCount: 0 });
  }

  for (const row of followers) {
    const current = counts.get(String(row._id)) ?? {
      followersCount: 0,
      followingCount: 0,
    };
    current.followersCount = row.count ?? 0;
    counts.set(String(row._id), current);
  }

  for (const row of following) {
    const current = counts.get(String(row._id)) ?? {
      followersCount: 0,
      followingCount: 0,
    };
    current.followingCount = row.count ?? 0;
    counts.set(String(row._id), current);
  }

  return counts;
}

export async function getViewerFollowedUserIds(viewerUserId: string) {
  const rows = await Follow.find({ followerUserId: viewerUserId })
    .select({ followedUserId: 1 })
    .lean();

  return rows.map((row) => String(row.followedUserId));
}

export async function getViewerFollowSet(
  viewerUserId: string | null,
  targetUserIds: string[],
) {
  const ids = Array.from(new Set(targetUserIds.filter(Boolean)));
  if (!viewerUserId || !ids.length) {
    return new Set<string>();
  }

  const rows = await Follow.find({
    followerUserId: viewerUserId,
    followedUserId: { $in: ids },
  })
    .select({ followedUserId: 1 })
    .lean();

  return new Set(rows.map((row) => String(row.followedUserId)));
}

export async function listFollowProfiles({
  subjectUserId,
  direction,
  viewerUserId,
  limit,
  cursor,
}: {
  subjectUserId: string;
  direction: "followers" | "following";
  viewerUserId: string | null;
  limit: number;
  cursor?: string | null;
}) {
  const isFollowers = direction === "followers";
  const subjectKey = isFollowers ? "followedUserId" : "followerUserId";
  const targetKey = isFollowers ? "followerUserId" : "followedUserId";

  const query: Record<string, unknown> = { [subjectKey]: subjectUserId };
  if (cursor && /^[a-f0-9]{24}$/i.test(cursor)) {
    query._id = { $lt: cursor };
  }

  const rows = await Follow.find(query)
    .sort("-_id")
    .limit(limit + 1)
    .lean();

  const pageRows = rows.slice(0, limit);
  const nextCursor =
    rows.length > limit ? String(pageRows[pageRows.length - 1]?._id) : null;

  const targetUserIds = pageRows.map((row) => String(row[targetKey] ?? ""));
  const [profiles, viewerFollowSet] = await Promise.all([
    UserProfile.find({ userId: { $in: targetUserIds } })
      .select({ userId: 1, handle: 1, displayName: 1, avatarUrl: 1 })
      .lean(),
    getViewerFollowSet(viewerUserId, targetUserIds),
  ]);

  const profileById = new Map(
    profiles.map((profile) => [
      String(profile.userId),
      {
        userId: String(profile.userId),
        handle: profile.handle ?? null,
        displayName: profile.displayName ?? null,
        avatarUrl: profile.avatarUrl ?? null,
      },
    ]),
  );

  const items: FollowListItemJson[] = targetUserIds.map((userId) => {
    const profile = profileById.get(userId) ?? {
      userId,
      handle: null,
      displayName: null,
      avatarUrl: null,
    };

    return {
      ...profile,
      viewerFollows: userId !== viewerUserId && viewerFollowSet.has(userId),
      isSelf: userId === viewerUserId,
    };
  });

  return { items, nextCursor };
}
