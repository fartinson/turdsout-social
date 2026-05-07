import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";

type HygraphPageResponse =
  | {
      data?: { page?: unknown | null };
      errors?: Array<{ message?: string }>;
    }
  | unknown;

function isSafeSlug(slug: string) {
  // about, privacy, terms, etc.
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const normalized = (slug ?? "").trim().toLowerCase();

  if (!normalized || !isSafeSlug(normalized)) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  if (!env.HYGRAPH_API_URL || !env.HYGRAPH_API_TOKEN) {
    return NextResponse.json(
      { error: "Hygraph is not configured." },
      { status: 501 },
    );
  }

  // Uses the existing Hygraph `Page` model (slug/title/content/seo/pageType/inFooter).
  const query = /* GraphQL */ `
    query CmsPageBySlug($slug: String!) {
      page(where: { slug: $slug }, stage: PUBLISHED) {
        id
        slug
        title
        pageType
        inFooter
        updatedAt
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
    body: JSON.stringify({ query, variables: { slug: normalized } }),
    cache: "no-store",
  });

  const json = (await res
    .json()
    .catch(() => null)) as HygraphPageResponse | null;

  if (!res.ok) {
    return NextResponse.json(
      { error: "Hygraph request failed.", status: res.status, details: json },
      { status: 502 },
    );
  }

  return NextResponse.json(json, { status: 200 });
}
