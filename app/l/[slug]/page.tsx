import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/env";
import { CmsRichText, isRichTextContent } from "@/components/cms-rich-text";
import { Avatar } from "@/components/Avatar";

function isSafeSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

type HygraphPage = {
  id: string;
  slug: string;
  title: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  showAuthor?: boolean | null;
  author?: { name?: string | null } | null;
  content: { raw?: unknown | null } | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    images?: Array<{ url?: string | null } | null> | null;
  } | null;
};

async function getPageBySlug(slug: string): Promise<HygraphPage | null> {
  if (!env.HYGRAPH_API_URL || !env.HYGRAPH_API_TOKEN) return null;

  const query = /* GraphQL */ `
    query CmsPageBySlug($slug: String!) {
      page(where: { slug: $slug }, stage: PUBLISHED) {
        id
        slug
        title
        updatedAt
        publishedAt
        showAuthor
        author {
          name
        }
        content {
          raw
        }
        seo {
          title
          description
          images {
            url
          }
        }
      }
    }
  `;

  const res = await fetch(env.HYGRAPH_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.HYGRAPH_API_TOKEN}`,
    },
    body: JSON.stringify({ query, variables: { slug } }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { page?: HygraphPage | null } };
  return json?.data?.page ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const normalized = (slug ?? "").trim().toLowerCase();
  if (!normalized || !isSafeSlug(normalized)) return { title: "Turdsout" };

  const page = await getPageBySlug(normalized);
  if (!page) return { title: "Turdsout" };

  const title = page.seo?.title ?? page.title ?? "Turdsout";
  const description = page.seo?.description ?? undefined;
  const ogImage = page.seo?.images?.[0]?.url ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function LorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const normalized = (slug ?? "").trim().toLowerCase();
  if (!normalized || !isSafeSlug(normalized)) notFound();

  const page = await getPageBySlug(normalized);
  if (!page) notFound();

  const raw = page.content?.raw ?? null;
  const authorName = page.author?.name?.trim()
    ? page.author?.name?.trim()
    : null;
  const showAuthor = Boolean(page.showAuthor && authorName);
  const published = page.publishedAt ? new Date(page.publishedAt) : null;
  const updated = page.updatedAt ? new Date(page.updatedAt) : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">
        {page.title ?? normalized}
      </h1>

      {showAuthor ? (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <Avatar
            src={null}
            name={authorName}
            size={40}
            className="bg-background"
          />
          <span className="text-muted">
            By{" "}
            <span className="text-foreground font-semibold">{authorName}</span>
          </span>
        </div>
      ) : null}

      {published || updated ? (
        <div className="text-muted mt-3 flex flex-wrap items-center gap-2 text-xs">
          {published ? (
            <>
              <span>Published</span>
              <time dateTime={published.toISOString()}>
                {formatDate(published)}
              </time>
            </>
          ) : null}
          {published && updated ? <span>·</span> : null}
          {updated ? (
            <>
              <span>Updated</span>
              <time dateTime={updated.toISOString()}>
                {formatDate(updated)}
              </time>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6">
        {isRichTextContent(raw) ? (
          <CmsRichText content={raw} className="text-foreground" />
        ) : (
          <p className="text-muted text-sm">No content yet.</p>
        )}
      </div>
    </main>
  );
}
