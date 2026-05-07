"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { routes } from "@/lib/routes";

type Profile = {
  userId: string;
  email: string;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  privacy: { showInFeed: boolean };
  settings: { emailNotifications: boolean };
};

export function ProfileEditorClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(false);

  const publicUrl = useMemo(() => {
    const h = handle.trim().toLowerCase();
    return h ? routes.userProfile(h) : null;
  }, [handle]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      const res = await fetch("/api/me/profile", { cache: "no-store" });
      if (!res.ok) {
        setError("Could not load profile.");
        return;
      }
      const data = (await res.json()) as { profile: Profile | null };
      if (cancelled) return;
      if (!data.profile) {
        setError("Profile missing. Try signing out and back in.");
        return;
      }
      setProfile(data.profile);
      setHandle(data.profile.handle ?? "");
      setDisplayName(data.profile.displayName ?? "");
      setAvatarUrl(data.profile.avatarUrl ?? "");
      setEmailNotifications(Boolean(data.profile.settings?.emailNotifications));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function save() {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle,
          displayName,
          avatarUrl,
          settings: { emailNotifications },
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        profile?: Profile | null;
        error?: string;
      } | null;
      if (!res.ok) {
        setError(data?.error ?? "Could not save profile.");
        return;
      }
      if (data?.profile) {
        setProfile(data.profile);
        setHandle(data.profile.handle ?? "");
        setDisplayName(data.profile.displayName ?? "");
        setAvatarUrl(data.profile.avatarUrl ?? "");
        setEmailNotifications(
          Boolean(data.profile.settings?.emailNotifications),
        );
      }
    });
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit profile
          </h1>
          <p className="text-muted mt-1 text-sm">{profile?.email ?? "@"}</p>
        </div>
        <Link
          href={routes.home}
          className="text-foreground text-sm font-semibold hover:underline"
        >
          Back
        </Link>
      </div>

      <div className="border-border bg-surface mt-6 rounded-2xl border p-5 shadow-sm">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Handle</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="border-border bg-background focus:border-border/70 mt-2 w-full rounded-xl border px-4 py-3 text-sm transition outline-none"
              placeholder="your_handle"
            />
            <p className="text-muted mt-2 text-xs">
              Public profile:{" "}
              {publicUrl ? (
                <Link href={publicUrl} className="font-medium hover:underline">
                  {publicUrl}
                </Link>
              ) : (
                <span>—</span>
              )}
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Display name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-border bg-background focus:border-border/70 mt-2 w-full rounded-xl border px-4 py-3 text-sm transition outline-none"
              placeholder="Optional"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Avatar URL &bull; Coming soon
            </span>
            <input
              disabled={true}
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="border-border bg-background focus:border-border/70 mt-2 w-full rounded-xl border px-4 py-3 text-sm transition outline-none"
              // placeholder="https://…"
              placeholder="Coming soon"
            />
          </label>

          <label className="border-border bg-background flex items-center gap-3 rounded-xl border px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Email notifications (not used yet)</span>
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <button
          onClick={save}
          disabled={isPending}
          className="bg-primary text-primary-foreground mt-6 inline-flex w-full cursor-pointer items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </main>
  );
}
