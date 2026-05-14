"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { TurnstileInput } from "@/components/TurnstileInput";
import { POST_MAX_CHARS, validatePostBody } from "@/lib/content-rules";
import { FeedCard } from "@/components/FeedCard";
import { routes } from "@/lib/routes";
import { MAX_POST_MENTIONS } from "@/lib/post-mention-policy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faLink,
  faPenToSquare,
} from "@fortawesome/pro-solid-svg-icons";

type MentionPick = {
  userId: string;
  handle: string | null;
  displayName: string | null;
};

type CreatedPost = {
  id: string;
  body: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  author: { handle: string | null; avatarUrl: string | null };
  mentions: MentionPick[];
};

export function NewPostClient() {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [created, setCreated] = useState<CreatedPost | null>(null);
  const [mentions, setMentions] = useState<MentionPick[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [debouncedMentionQuery, setDebouncedMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState<MentionPick[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);

  const maxChars = POST_MAX_CHARS;
  const remaining = useMemo(
    () => maxChars - body.length,
    [body.length, maxChars],
  );

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedMentionQuery(mentionQuery.trim()),
      300,
    );
    return () => clearTimeout(t);
  }, [mentionQuery]);

  useEffect(() => {
    if (debouncedMentionQuery.length < 2) {
      setMentionResults([]);
      setMentionLoading(false);
      return;
    }
    let cancelled = false;
    setMentionLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(debouncedMentionQuery)}`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as { users?: MentionPick[] };
        if (!cancelled) setMentionResults(data.users ?? []);
      } catch {
        if (!cancelled) setMentionResults([]);
      } finally {
        if (!cancelled) setMentionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedMentionQuery]);

  function addMention(user: MentionPick) {
    if (mentions.length >= MAX_POST_MENTIONS) return;
    if (mentions.some((m) => m.userId === user.userId)) return;
    setMentions((prev) => [...prev, user]);
    setMentionQuery("");
    setMentionResults([]);
    setMentionMenuOpen(false);
  }

  function removeMention(userId: string) {
    setMentions((prev) => prev.filter((m) => m.userId !== userId));
  }

  function formatMentionLabel(m: MentionPick) {
    if (m.displayName?.trim()) {
      return m.handle
        ? `${m.displayName.trim()} (@${m.handle})`
        : m.displayName.trim();
    }
    return m.handle ? `@${m.handle}` : "User";
  }

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
        mentionedUserIds: mentions.map((m) => m.userId),
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
      setCreated({
        ...data.post,
        mentions: Array.isArray(data.post.mentions) ? data.post.mentions : [],
      });
      setBody("");
      setTurnstileToken("");
      setMentions([]);
      setMentionQuery("");
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
            mentions={created.mentions}
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
              onClick={() => {
                setCreated(null);
                setMentions([]);
                setMentionQuery("");
              }}
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

          <div className="mt-5 space-y-3">
            <div>
              <span className="text-sm font-medium">Tag people (optional)</span>
              <p className="text-muted mt-1 text-xs">
                Up to {MAX_POST_MENTIONS} tags per turd. Search by handle or
                display name. Tags do not count toward your character limit.
              </p>
            </div>

            {mentions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mentions.map((m) => (
                  <span
                    key={m.userId}
                    className="border-border bg-background text-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                  >
                    <span className="max-w-[220px] truncate">
                      {formatMentionLabel(m)}
                    </span>
                    <button
                      type="button"
                      className="text-muted hover:text-foreground"
                      aria-label={`Remove tag ${formatMentionLabel(m)}`}
                      onClick={() => removeMention(m.userId)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="relative">
              <input
                type="search"
                autoComplete="off"
                value={mentionQuery}
                onChange={(e) => {
                  setMentionQuery(e.target.value);
                  setMentionMenuOpen(true);
                }}
                onFocus={() => setMentionMenuOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setMentionMenuOpen(false), 120);
                }}
                placeholder={
                  mentions.length >= MAX_POST_MENTIONS
                    ? "Maximum tags reached"
                    : "Search people to tag…"
                }
                disabled={mentions.length >= MAX_POST_MENTIONS}
                className="border-border bg-background focus:border-border/70 w-full rounded-xl border px-4 py-3 text-base transition outline-none"
              />
              {mentionMenuOpen &&
              mentionQuery.trim().length >= 2 &&
              mentions.length < MAX_POST_MENTIONS ? (
                <ul className="border-border bg-background absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-xl border py-1 text-sm shadow-md">
                  {mentionLoading ? (
                    <li className="text-muted px-3 py-2">Searching…</li>
                  ) : mentionResults.filter(
                      (u) => !mentions.some((m) => m.userId === u.userId),
                    ).length === 0 ? (
                    <li className="text-muted px-3 py-2">No matches</li>
                  ) : (
                    mentionResults
                      .filter((u) => !mentions.some((m) => m.userId === u.userId))
                      .map((u) => (
                        <li key={u.userId}>
                          <button
                            type="button"
                            className="hover:bg-surface/60 w-full px-3 py-2 text-left"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => addMention(u)}
                          >
                            {formatMentionLabel(u)}
                          </button>
                        </li>
                      ))
                  )}
                </ul>
              ) : null}
            </div>
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
