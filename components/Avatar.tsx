"use client";

import { cn } from "@/lib/cn";
import Image from "next/image";
import { useState } from "react";

function initialsFromName(name: string) {
  const cleaned = name.trim().replace(/^@/, "");
  if (!cleaned) return "";

  const parts = cleaned
    .split(/[\s._-]+/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const first = parts[0]?.[0] ?? "";
  const second = (parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1]) ?? "";

  return (first + second).toUpperCase();
}

export type AvatarProps = {
  /** Image URL. If missing or fails to load, we render initials/fallback. */
  src?: string | null;
  /** Used for initials + accessible label when no `alt` is provided. */
  name?: string | null;
  /** Accessible label for the avatar image/fallback. */
  alt?: string;
  /** Pixel size for width/height. */
  size?: number;
  className?: string;
};

export function Avatar({ src, name, alt, size = 32, className }: AvatarProps) {
  const [broken, setBroken] = useState(false);

  const label = alt ?? (name ? `${name} avatar` : "User avatar");
  const initials = name ? initialsFromName(name) : "";
  const showImage = Boolean(src) && !broken;

  return (
    <span
      className={cn(
        "border-border bg-surface text-muted inline-flex shrink-0 items-center justify-center overflow-clip rounded-full border font-semibold",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={label}
      role="img"
      title={name ? name : undefined}
    >
      {showImage ? (
        <Image
          src={src!}
          alt={label}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : initials ? (
        <span className="text-xs leading-none select-none">{initials}</span>
      ) : (
        <span className="text-xs leading-none select-none">?</span>
      )}
    </span>
  );
}
