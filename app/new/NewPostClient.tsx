"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { TurnstileInput } from "@/components/TurnstileInput";
import { POST_MAX_CHARS, validatePostBody } from "@/lib/content-rules";
import { FeedCard } from "@/components/FeedCard";
import { routes } from "@/lib/routes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faLink,
  faPenToSquare,
} from "@fortawesome/pro-solid-svg-icons";

type CreatedPost = {
  id: string;
  body: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  author: { handle: string | null; avatarUrl: string | null };
};

export function NewPostClient() {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [created, setCreated] = useState<CreatedPost | null>(null);

  const maxChars = POST_MAX_CHARS;
  const remaining = useMemo(
    () => maxChars - body.length,
    [body.length, maxChars],
  );

  async function onSubmit() {
    setError(null);

    const parsed = validatePostBody(body);
    if (!parsed.ok) {
      setError(parsed.reason);
      return;
    }

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        body: parsed.body,
        hp: "",
        turnstileToken: turnstileToken || undefined,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Could not post.");
      return;
    }

    const data = (await res.json().catch(() => null)) as {
      post?: CreatedPost;
    } | null;
    if (data?.post?.id) {
      setCreated(data.post);
      setBody("");
      setTurnstileToken("");
      return;
    }

    // Fallback if the API response is unexpected
    window.location.href = routes.home;
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Drop a Turd</h1>
        <Link
          href={routes.home}
          className="text-foreground text-sm font-semibold hover:underline"
        >
          Back
        </Link>
      </div>

      {created ? (
        <div className="mt-6 space-y-3">
          <div className="border-border bg-surface rounded-2xl border p-5 text-sm">
            <p className="text-foreground font-semibold">You did it.</p>
            <p className="text-muted mt-1">
              Share it before the algorithm forgets it ever existed.
            </p>
          </div>

          <FeedCard
            postId={created.id}
            body={created.body}
            createdAt={created.createdAt}
            author={created.author}
            signedIn
            initialUpvotes={created.upvotes}
            initialDownvotes={created.downvotes}
            initialVote={0}
            initialBookmarked={false}
            showTime
          />

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold">
            <Link
              href={routes.post(created.id)}
              className="border-border bg-background text-foreground hover:bg-surface/60 inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2"
            >
              <FontAwesomeIcon icon={faLink} className="text-xs" />
              <span>View permalink</span>
            </Link>

            <button
              type="button"
              className="border-border bg-background text-foreground hover:bg-surface/60 inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2"
              onClick={() => setCreated(null)}
            >
              <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
              <span>Post another</span>
            </button>

            <Link
              href={routes.home}
              className="border-border bg-background text-foreground hover:bg-surface/60 inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
              <span>Back to feed</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="border-border bg-surface mt-6 rounded-2xl border p-5 shadow-sm">
          <label className="block">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={maxChars}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              className="border-border bg-background focus:border-border/70 mt-2 w-full resize-none rounded-xl border px-4 py-3 text-base transition outline-none"
              placeholder="Turdsout you peaked in middle school."
            />
          </label>

          <div className="text-muted mt-3 flex items-center justify-between text-xs">
            <span>{remaining} characters left</span>
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <TurnstileInput name="turnstileToken" onToken={setTurnstileToken} />

          <button
            onClick={() => startTransition(onSubmit)}
            disabled={isPending}
            className="bg-primary text-primary-foreground mt-5 inline-flex w-full cursor-pointer items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Dropping it..." : "Drop it"}
          </button>
        </div>
      )}
    </main>
  );
}
