"use client";

import { useMemo, useState } from "react";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faSpinner,
} from "@fortawesome/pro-solid-svg-icons";

type Props = {
  postId: string;
  className?: string;
};

export function SharePostButton({ postId, className }: Props) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);

  const url = useMemo(() => {
    // Runs on client; safe to read window.
    const path = routes.post(postId);
    if (typeof window === "undefined") return path;
    return new URL(path, window.location.origin).toString();
  }, [postId]);

  async function share() {
    if (pending) return;
    setPending(true);
    try {
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
    } catch {
      // If user cancels share sheet, just fall back to copy.
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      disabled={pending}
      className={cn(
        "border-border bg-background text-foreground hover:bg-surface/60 inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1 text-xs font-semibold disabled:cursor-wait disabled:opacity-70",
        className,
      )}
      aria-label="Share post"
      aria-busy={pending}
      title={copied ? "Copied link" : pending ? "Opening share…" : "Share"}
    >
      <FontAwesomeIcon
        icon={pending ? faSpinner : faArrowUpFromBracket}
        spin={pending}
        className="text-xs"
      />
      <span>{copied ? "Copied" : pending ? "Sharing" : "Share"}</span>
    </button>
  );
}
