import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        Check your email
      </h1>
      <p className="text-muted mt-3 text-sm text-pretty">
        We sent you a magic link. If it doesn’t show up, check spam. If it still
        doesn’t show up… Turdsout.
      </p>
      <div className="mt-10">
        <Link
          href="/"
          className="border-border bg-background hover:bg-surface/60 inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
