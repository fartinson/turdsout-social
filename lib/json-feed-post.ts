export type FeedItemAuthorJson = {
  userId: string;
  handle: string | null;
  avatarUrl: string | null;
};

export type FeedItemJson = {
  id: string;
  body: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author: FeedItemAuthorJson;
  viewerVote: 1 | -1 | 0;
  viewerBookmarked: boolean;
};

type PostLean = {
  _id: unknown;
  body: string;
  upvotes?: number;
  downvotes?: number;
  createdAt?: Date;
};

export function toFeedItemJson(
  post: PostLean,
  author: FeedItemAuthorJson,
  viewerVote: 1 | -1 | 0,
  viewerBookmarked: boolean,
): FeedItemJson {
  return {
    id: String(post._id),
    body: String(post.body),
    upvotes: post.upvotes ?? 0,
    downvotes: post.downvotes ?? 0,
    createdAt:
      post.createdAt?.toISOString?.() ?? new Date().toISOString(),
    author,
    viewerVote,
    viewerBookmarked,
  };
}
