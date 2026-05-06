"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { TurnstileInput } from "@/components/TurnstileInput";
import { POST_MAX_CHARS } from "@/lib/content-rules";

export function NewPostClient() {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const maxChars = POST_MAX_CHARS;
  const remaining = useMemo(() => maxChars - body.length, [body.length]);

  async function onSubmit() {
    setError(null);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body, hp: "", turnstileToken: turnstileToken || undefined }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not post.");
      return;
    }

    setBody("");
    window.location.href = "/";
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">New Turdsout</h1>
        <Link href="/" className="text-sm font-semibold text-zinc-700 hover:underline dark:text-zinc-300">
          Back
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <label className="block">
          <span className="text-sm font-medium">Your line</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={maxChars}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Turdsout I peaked in middle school."
          />
        </label>

        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
          <span>{remaining} characters left</span>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <TurnstileInput name="turnstileToken" onToken={setTurnstileToken} />

        <button
          onClick={() => startTransition(onSubmit)}
          disabled={isPending}
          className="mt-5 inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending ? "Posting…" : "Post"}
        </button>
      </div>
    </main>
  );
}

