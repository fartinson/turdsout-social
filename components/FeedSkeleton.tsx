export function FeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-4 space-y-3" aria-label="Loading feed">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
        >
          <div className="h-4 w-4/5 animate-pulse rounded bg-border/60" />
          <div className="mt-3 h-4 w-3/5 animate-pulse rounded bg-border/60" />
          <div className="mt-5 flex items-center gap-3">
            <div className="h-7 w-24 animate-pulse rounded bg-border/60" />
            <div className="h-7 w-10 animate-pulse rounded bg-border/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

