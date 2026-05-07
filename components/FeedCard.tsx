"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { Avatar } from "@/components/Avatar";
import { FeedPostEngagement } from "@/components/FeedPostEngagement";
import { SharePostButton } from "@/components/SharePostButton";

const FeedCardTimestamp = dynamic(
  () => import("./FeedCardTimestamp").then((m) => m.FeedCardTimestamp),
  {
    ssr: false,
    loading: () => <span className="tabular-nums">…</span>,
  },
);

export type FeedCardAuthor = {
  handle: string | null;
  avatarUrl: string | null;
};

export type FeedCardProps = {
  postId: string;
  body: string;
  createdAt: string;
  author: FeedCardAuthor;

  signedIn: boolean;
  initialUpvotes: number;
  initialDownvotes: number;
  initialVote: 1 | -1 | 0;
  initialBookmarked: boolean;

  /** If true, show a full timestamp; otherwise show date only. */
  showTime?: boolean;
};

export function FeedCard({
  postId,
  body,
  createdAt,
  author,
  signedIn,
  initialUpvotes,
  initialDownvotes,
  initialVote,
  initialBookmarked,
  showTime = false,
}: FeedCardProps) {
  return (
    <article className="border-border bg-surface rounded-2xl border p-5 shadow-sm">
      <Link
        href={routes.post(postId)}
        className="text-foreground block text-base leading-7 text-pretty underline-offset-2 hover:underline"
      >
        {body}
      </Link>

      <div className="text-muted mt-3 flex flex-wrap items-center gap-2 text-xs">
        <Link
          href={author.handle ? routes.userProfile(author.handle) : routes.home}
        >
          <Avatar
            src={author.avatarUrl}
            name={author.handle ? `@${author.handle}` : "Anonymous Turd"}
            size={32}
            className="bg-background"
          />
        </Link>
        {author.handle ? (
          <Link
            href={routes.userProfile(author.handle)}
            className="text-foreground font-medium hover:underline"
          >
            @{author.handle}
          </Link>
        ) : (
          <span className="text-foreground font-medium">Anonymous Turd</span>
        )}

        <span>·</span>
        <FeedCardTimestamp createdAt={createdAt} showTime={showTime} />

        <span className="flex-1" />
        <SharePostButton postId={postId} />
      </div>

      <FeedPostEngagement
        postId={postId}
        signedIn={signedIn}
        initialUpvotes={initialUpvotes}
        initialDownvotes={initialDownvotes}
        initialVote={initialVote}
        initialBookmarked={initialBookmarked}
      />
    </article>
  );
}
