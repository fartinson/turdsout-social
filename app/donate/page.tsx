import Link from "next/link";
import { routes } from "@/lib/routes";

type Tier = {
  name: string;
  price: string;
  tagline: string;
  perks: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
};

const tiers: Tier[] = [
  {
    name: "Tip Jar",
    price: "$5",
    tagline: "A small high-five for keeping the toilets clean.",
    perks: ["Keeps the lights on", "Good karma", "No commitments"],
    cta: {
      label: "Donate $5",
      href: "mailto:support@turdsout.com?subject=Turdsout%20donation%20(%245)",
    },
  },
  {
    name: "Supporter",
    price: "$20",
    tagline: "For people who want this place to exist tomorrow.",
    perks: [
      "Helps cover email + database costs",
      "Funds moderation tooling",
      "Supports new features",
    ],
    cta: {
      label: "Donate $20",
      href: "mailto:support@turdsout.com?subject=Turdsout%20donation%20(%2420)",
    },
    highlighted: true,
  },
  {
    name: "Patron",
    price: "$100",
    tagline: "You're basically sponsoring a whole flush cycle.",
    perks: [
      "Funds performance + anti-abuse upgrades",
      "Helps us ship faster",
      "Serious gratitude",
    ],
    cta: {
      label: "Donate $100",
      href: "mailto:support@turdsout.com?subject=Turdsout%20donation%20(%24100)",
    },
  },
];

function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "border-border bg-surface rounded-2xl border p-6 shadow-sm",
        className ?? "",
      ].join(" ")}
    >
      {title ? (
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

export default function DonatePage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-muted text-sm font-semibold">Funding</p>
          <h1 className="text-foreground mt-2 text-3xl font-semibold tracking-tight text-balance">
            Help keep Turdsout online.
          </h1>
          <p className="text-muted mt-3 max-w-2xl text-sm text-pretty">
            Turdsout is a tiny, weird corner of the internet. If it made you
            laugh (or feel less alone), consider donating. Your support pays for
            the boring stuff: email delivery, databases, bot protection, and
            keeping the feed fast.
          </p>
        </div>

        <Link
          href={routes.home}
          className="text-foreground text-sm font-semibold hover:underline"
        >
          Back to feed
        </Link>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {tiers.map((tier) => (
          <section
            key={tier.name}
            className={[
              "border-border bg-surface rounded-2xl border p-6 shadow-sm",
              tier.highlighted ? "ring-primary/25 ring-2" : "",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-foreground text-lg font-semibold">
                  {tier.name}
                </h2>
                <p className="text-muted mt-1 text-sm">{tier.tagline}</p>
              </div>
              <div className="text-right">
                <div className="text-foreground text-2xl font-semibold">
                  {tier.price}
                </div>
                <div className="text-muted text-xs">one-time</div>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-sm">
              {tier.perks.map((p) => (
                <li key={p} className="text-foreground">
                  <span className="text-muted">•</span> {p}
                </li>
              ))}
            </ul>

            <a
              href={tier.cta.href}
              className={[
                "mt-6 inline-flex w-full cursor-pointer items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90",
                tier.highlighted
                  ? "bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-surface/60 border",
              ].join(" ")}
              rel="nofollow"
            >
              {tier.cta.label}
            </a>

            <p className="text-muted mt-3 text-xs">
              Don’t see your vibe?{" "}
              <a
                className="text-foreground font-semibold hover:underline"
                href="mailto:support@turdsout.com?subject=Turdsout%20donation"
              >
                Email us
              </a>{" "}
              and we’ll figure it out.
            </p>
          </section>
        ))}
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <Card title="What funding covers">
          <ul className="text-muted mt-3 space-y-2 text-sm">
            <li>
              <span className="text-foreground font-semibold">
                Infrastructure
              </span>
              : hosting, database, storage, caching.
            </li>
            <li>
              <span className="text-foreground font-semibold">Email</span>:
              passwordless sign-in links.
            </li>
            <li>
              <span className="text-foreground font-semibold">Anti-abuse</span>:
              Turnstile, rate limits, moderation tools.
            </li>
          </ul>
        </Card>

        <Card title="A note on transparency">
          <p className="text-muted mt-3 text-sm">
            We’ll keep it simple: if costs go up, we’ll say so. If we ever turn
            on premium features, donors won’t get locked out of the basics.
          </p>
        </Card>

        <Card title="FAQ">
          <div className="mt-3 space-y-4 text-sm">
            <div>
              <p className="text-foreground font-semibold">
                Is this a subscription?
              </p>
              <p className="text-muted mt-1">
                Nope. These are one-time donations.
              </p>
            </div>
            <div>
              <p className="text-foreground font-semibold">
                Can I donate anonymously?
              </p>
              <p className="text-muted mt-1">Yes—email and we’ll coordinate.</p>
            </div>
            <div>
              <p className="text-foreground font-semibold">
                Do I get a refund?
              </p>
              <p className="text-muted mt-1">
                If something goes sideways, reach out and we’ll make it right.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
