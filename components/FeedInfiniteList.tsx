"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FeedCard } from "@/components/FeedCard";
import { FeedSkeleton } from "@/components/FeedSkeleton";

type FeedItem = {
  id: string;
  body: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author: { handle: string | null; avatarUrl: string | null };
  viewerVote: 1 | -1 | 0;
  viewerBookmarked: boolean;
};

export function FeedInfiniteList({
  sort,
  signedIn,
  pageSize = 20,
}: {
  sort: "top" | "new";
  signedIn: boolean;
  pageSize?: number;
}) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const basePath = useMemo(() => {
    // Must be SSR-safe. Next can pre-render client components on the server.
    const qs = new URLSearchParams({
      sort,
      limit: String(pageSize),
    });
    return `/api/posts?${qs.toString()}`;
  }, [pageSize, sort]);

  const loadPage = useCallback(
    async (cursor: string | null) => {
      const url = cursor
        ? `${basePath}&cursor=${encodeURIComponent(cursor)}`
        : basePath;
      const res = await fetch(url, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as {
        items?: FeedItem[];
        nextCursor?: string | null;
        error?: string;
      } | null;
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not load feed.");
      }
      return {
        items: data?.items ?? [],
        nextCursor: data?.nextCursor ?? null,
      };
    },
    [basePath],
  );

  // Initial load + reset on sort change
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      setItems([]);
      setNextCursor(null);
    });
    (async () => {
      try {
        const page = await loadPage(null);
        if (cancelled) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load feed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPage, pageSize, sort]);

  // Infinite scroll
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!nextCursor) return;
    if (loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit) return;
        observer.disconnect();
        setLoadingMore(true);
        setError(null);
        (async () => {
          try {
            const page = await loadPage(nextCursor);
            setItems((prev) => prev.concat(page.items));
            setNextCursor(page.nextCursor);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load more.");
          } finally {
            setLoadingMore(false);
          }
        })();
      },
      { rootMargin: "800px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadPage, loading, loadingMore, nextCursor]);

  if (loading) return <FeedSkeleton />;

  if (error) {
    return (
      <div className="border-border bg-surface text-muted mt-4 rounded-2xl border border-dashed p-6 text-sm">
        {error}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="border-border bg-surface text-muted mt-4 rounded-2xl border border-dashed p-6 text-sm">
        Nothing yet. The first Turdsout is the hardest.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {items.map((p) => (
        <FeedCard
          key={p.id}
          postId={p.id}
          body={p.body}
          createdAt={p.createdAt}
          author={{ handle: p.author.handle, avatarUrl: p.author.avatarUrl }}
          signedIn={signedIn}
          initialUpvotes={p.upvotes}
          initialDownvotes={p.downvotes}
          initialVote={p.viewerVote}
          initialBookmarked={p.viewerBookmarked}
        />
      ))}

      <div ref={sentinelRef} className="h-1" />

      {loadingMore ? <FeedSkeleton count={2} /> : null}
      {!nextCursor ? (
        <div className="text-muted py-4 text-center text-xs">
          You&apos;re all caught up.
        </div>
      ) : null}
    </div>
  );
}
