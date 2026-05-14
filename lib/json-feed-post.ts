export type FeedItemAuthorJson = {
  userId: string;
  handle: string | null;
  avatarUrl: string | null;
};

export type FeedMentionJson = {
  userId: string;
  handle: string | null;
  displayName: string | null;
};

export type FeedItemJson = {
  id: string;
  body: string;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  createdAt: string;
  author: FeedItemAuthorJson;
  viewerVote: 1 | -1 | 0;
  viewerBookmarked: boolean;
  mentions: FeedMentionJson[];
};

type PostLean = {
  _id: unknown;
  body: string;
  upvotes?: number;
  downvotes?: number;
  replyCount?: number;
  createdAt?: Date;
  mentionedUserIds?: string[] | null;
};

export function buildMentionsJson(
  mentionedUserIds: string[] | null | undefined,
  mentionProfilesById: Map<string, FeedMentionJson>,
): FeedMentionJson[] {
  const ids = Array.isArray(mentionedUserIds)
    ? mentionedUserIds.map(String).filter(Boolean)
    : [];
  return ids.map((id) => {
    const p = mentionProfilesById.get(id);
    return {
      userId: id,
      handle: p?.handle ?? null,
      displayName: p?.displayName ?? null,
    };
  });
}

export function toFeedItemJson(
  post: PostLean,
  author: FeedItemAuthorJson,
  viewerVote: 1 | -1 | 0,
  viewerBookmarked: boolean,
  mentions: FeedMentionJson[],
): FeedItemJson {
  return {
    id: String(post._id),
    body: String(post.body),
    upvotes: post.upvotes ?? 0,
    downvotes: post.downvotes ?? 0,
    replyCount: post.replyCount ?? 0,
    createdAt: post.createdAt?.toISOString?.() ?? new Date().toISOString(),
    author,
    viewerVote,
    viewerBookmarked,
    mentions,
  };
}
