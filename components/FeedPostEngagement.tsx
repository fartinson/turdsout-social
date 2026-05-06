"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { engagementUi } from "@/lib/engagement-ui";
import { routes } from "@/lib/routes";

type Props = {
  postId: string;
  signedIn: boolean;
  initialUpvotes: number;
  initialDownvotes: number;
  /** 1, -1, or 0 when no vote */
  initialVote: 1 | -1 | 0;
  initialBookmarked: boolean;
};

export function FeedPostEngagement({
  postId,
  signedIn,
  initialUpvotes,
  initialDownvotes,
  initialVote,
  initialBookmarked,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [vote, setVote] = useState<1 | -1 | 0>(initialVote);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  const net = useMemo(() => upvotes - downvotes, [upvotes, downvotes]);

  function requireAuth() {
    router.push(routes.signIn);
  }

  function sendVote(value: 1 | -1) {
    if (!signedIn) {
      requireAuth();
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { upvotes?: number; downvotes?: number };
      if (typeof data.upvotes === "number") setUpvotes(data.upvotes);
      if (typeof data.downvotes === "number") setDownvotes(data.downvotes);
      setVote(value);
    });
  }

  function toggleBookmark() {
    if (!signedIn) {
      requireAuth();
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/posts/${postId}/bookmark`, { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as { bookmarked?: boolean };
      if (typeof data.bookmarked === "boolean") setBookmarked(data.bookmarked);
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <button
          type="button"
          disabled={pending}
          onClick={() => sendVote(1)}
          aria-pressed={vote === 1}
          title={engagementUi.voteUp.accessibleName}
          aria-label={engagementUi.voteUp.accessibleName}
          className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-zinc-700 aria-pressed:bg-white aria-pressed:shadow-sm dark:text-zinc-200 dark:aria-pressed:bg-zinc-950"
        >
          {engagementUi.voteUp.symbol}
        </button>
        <span className="min-w-6 px-1 text-center text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
          {net}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => sendVote(-1)}
          aria-pressed={vote === -1}
          title={engagementUi.voteDown.accessibleName}
          aria-label={engagementUi.voteDown.accessibleName}
          className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-zinc-700 aria-pressed:bg-white aria-pressed:shadow-sm dark:text-zinc-200 dark:aria-pressed:bg-zinc-950"
        >
          {engagementUi.voteDown.symbol}
        </button>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={toggleBookmark}
        aria-pressed={bookmarked}
        title={bookmarked ? engagementUi.bookmark.removeAccessibleName : engagementUi.bookmark.addAccessibleName}
        aria-label={bookmarked ? engagementUi.bookmark.removeAccessibleName : engagementUi.bookmark.addAccessibleName}
        className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 aria-pressed:border-amber-300 aria-pressed:bg-amber-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:aria-pressed:border-amber-600 dark:aria-pressed:bg-amber-950/40"
      >
        {bookmarked ? "★" : "☆"}
      </button>
    </div>
  );
}
