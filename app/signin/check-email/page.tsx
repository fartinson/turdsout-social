import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-20">
      <h1 className="text-balance text-3xl font-semibold tracking-tight">Check your email</h1>
      <p className="mt-3 text-pretty text-sm text-zinc-600 dark:text-zinc-400">
        We sent you a magic link. If it doesn’t show up, check spam. If it still doesn’t show up… Turdsout.
      </p>
      <div className="mt-10">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

