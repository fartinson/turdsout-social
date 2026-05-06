"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { engagementUi } from "@/lib/engagement-ui";
import { routes } from "@/lib/routes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/pro-solid-svg-icons";
import { faBookmark as faBookmarkSolid } from "@fortawesome/pro-solid-svg-icons";
import { faBookmark as faBookmarkRegular } from "@fortawesome/pro-regular-svg-icons";

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
      const data = (await res.json()) as {
        upvotes?: number;
        downvotes?: number;
      };
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
      const res = await fetch(`/api/posts/${postId}/bookmark`, {
        method: "POST",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { bookmarked?: boolean };
      if (typeof data.bookmarked === "boolean") setBookmarked(data.bookmarked);
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <div className="border-border bg-surface/60 flex items-center gap-0.5 rounded-lg border p-0.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => sendVote(1)}
          aria-pressed={vote === 1}
          title={engagementUi.voteUp.accessibleName}
          aria-label={engagementUi.voteUp.accessibleName}
          className="text-foreground aria-pressed:bg-background cursor-pointer rounded-md px-2 py-1 text-xs font-medium aria-pressed:shadow-sm"
        >
          <FontAwesomeIcon icon={faChevronUp} />
        </button>
        <span className="text-muted min-w-6 px-1 text-center text-xs tabular-nums">
          {net}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => sendVote(-1)}
          aria-pressed={vote === -1}
          title={engagementUi.voteDown.accessibleName}
          aria-label={engagementUi.voteDown.accessibleName}
          className="text-foreground aria-pressed:bg-background cursor-pointer rounded-md px-2 py-1 text-xs font-medium aria-pressed:shadow-sm"
        >
          <FontAwesomeIcon icon={faChevronDown} />
        </button>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={toggleBookmark}
        aria-pressed={bookmarked}
        title={
          bookmarked
            ? engagementUi.bookmark.removeAccessibleName
            : engagementUi.bookmark.addAccessibleName
        }
        aria-label={
          bookmarked
            ? engagementUi.bookmark.removeAccessibleName
            : engagementUi.bookmark.addAccessibleName
        }
        className="border-border bg-background text-foreground aria-pressed:border-accent aria-pressed:bg-accent/15 cursor-pointer rounded-lg border px-2 py-1 text-xs font-medium"
      >
        <FontAwesomeIcon
          icon={bookmarked ? faBookmarkSolid : faBookmarkRegular}
        />
      </button>
    </div>
  );
}
