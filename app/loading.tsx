import { FeedSkeleton } from "@/components/FeedSkeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="border-border bg-surface rounded-2xl border border-dashed p-6 text-sm">
        <div className="bg-border/60 h-4 w-3/5 animate-pulse rounded" />
        <div className="bg-border/60 mt-3 h-4 w-2/5 animate-pulse rounded" />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="bg-border/60 h-9 w-28 animate-pulse rounded-xl" />
          <div className="bg-border/60 h-6 w-36 animate-pulse rounded" />
        </div>
      </div>

      <FeedSkeleton />
    </main>
  );
}
