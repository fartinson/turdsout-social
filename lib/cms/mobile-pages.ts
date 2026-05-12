import { env } from "../../env";

export const MOBILE_CMS_PINNED_SLUGS = ["what-is-turdsout"] as const;

export type MobileCmsTextRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  href?: string | null;
};

export type MobileCmsBlock =
  | {
      type: "heading";
      level: 2 | 3 | 4;
      runs: MobileCmsTextRun[];
    }
  | {
      type: "paragraph";
      runs: MobileCmsTextRun[];
    }
  | {
      type: "list";
      style: "bulleted" | "numbered";
      items: Array<{
        id: string;
        runs: MobileCmsTextRun[];
      }>;
    }
  | {
      type: "quote";
      runs: MobileCmsTextRun[];
    }
  | {
      type: "divider";
    }
  | {
      type: "image";
      url: string;
      alt: string | null;
    };

export type MobileCmsPageSummary = {
  id: string;
  slug: string;
  title: string;
  pageType: string | null;
  inFooter: boolean;
  updatedAt: string | null;
};

export type MobileCmsPage = MobileCmsPageSummary & {
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: MobileCmsBlock[];
};

export type MobileCmsBundle = {
  schemaVersion: 1;
  generatedAt: string;
  items: MobileCmsPage[];
};

type HygraphPageSummary = {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
  pageType?: string | null;
  inFooter?: boolean | null;
  updatedAt?: string | null;
};

type HygraphPage = HygraphPageSummary & {
  content?: {
    raw?: unknown | null;
  } | null;
  seo?: {
    title?: string | null;
    description?: string | null;
  } | null;
};

type HygraphCollectionResponse<T> = {
  data?: {
    pages?: Array<T | null> | null;
  };
  errors?: Array<{ message?: string }>;
};

type HygraphSingleResponse<T> = {
  data?: {
    page?: T | null;
  };
  errors?: Array<{ message?: string }>;
};

type HygraphNode = {
  type?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  href?: string;
  src?: string;
  title?: string;
  altText?: string;
  children?: HygraphNode[];
};

const HYGRAPH_PAGE_SUMMARY_FIELDS = /* GraphQL */ `
  id
  slug
  title
  pageType
  inFooter
  updatedAt
`;

const HYGRAPH_PAGE_DETAIL_FIELDS = /* GraphQL */ `
  ${HYGRAPH_PAGE_SUMMARY_FIELDS}
  content {
    raw
  }
  seo {
    title
    description
  }
`;

export class MobileCmsError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "MobileCmsError";
  }
}

export function isSafeCmsSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export async function fetchMobileCmsPageSummaries(): Promise<
  MobileCmsPageSummary[]
> {
  const data = await fetchHygraphCollection<HygraphPageSummary>(/* GraphQL */ `
      query CmsPagesForAppMenu {
        pages(where: { inFooter: true }, stage: PUBLISHED, orderBy: title_ASC) {
          ${HYGRAPH_PAGE_SUMMARY_FIELDS}
        }
      }
    `);

  return normalizePageSummaries(data);
}

export async function fetchMobileCmsPageBySlug(
  slug: string,
): Promise<MobileCmsPage | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized || !isSafeCmsSlug(normalized)) {
    throw new MobileCmsError("Invalid slug.", 400);
  }

  const data = await fetchHygraphPage(normalized);
  if (!data) return null;

  return normalizePageDetail(data);
}

export async function fetchMobileCmsBundle(): Promise<MobileCmsBundle> {
  const [footerPages, pinnedPages] = await Promise.all([
    fetchHygraphCollection<HygraphPage>(/* GraphQL */ `
        query CmsPagesForMobileBundle {
          pages(where: { inFooter: true }, stage: PUBLISHED, orderBy: title_ASC) {
            ${HYGRAPH_PAGE_DETAIL_FIELDS}
          }
        }
      `),
    Promise.all(
      MOBILE_CMS_PINNED_SLUGS.map(async (slug) => fetchHygraphPage(slug)),
    ),
  ]);

  const deduped = new Map<string, MobileCmsPage>();

  for (const page of [...normalizePageDetails(footerPages), ...pinnedPages]) {
    if (!page) continue;
    deduped.set(page.slug, normalizePageDetail(page));
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    items: [...deduped.values()].sort((a, b) => a.title.localeCompare(b.title)),
  };
}

async function fetchHygraphPage(slug: string): Promise<HygraphPage | null> {
  const data = await fetchHygraphSingle<HygraphPage>(
    /* GraphQL */ `
      query CmsPageBySlug($slug: String!) {
        page(where: { slug: $slug }, stage: PUBLISHED) {
          ${HYGRAPH_PAGE_DETAIL_FIELDS}
        }
      }
    `,
    { slug },
  );

  return data ?? null;
}

async function fetchHygraphCollection<T>(
  query: string,
  variables?: Record<string, unknown>,
) {
  const payload = await postToHygraph<HygraphCollectionResponse<T>>(
    query,
    variables,
  );
  return payload?.data?.pages ?? [];
}

async function fetchHygraphSingle<T>(
  query: string,
  variables?: Record<string, unknown>,
) {
  const payload = await postToHygraph<HygraphSingleResponse<T>>(
    query,
    variables,
  );
  return payload?.data?.page ?? null;
}

async function postToHygraph<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  if (!env.HYGRAPH_API_URL || !env.HYGRAPH_API_TOKEN) {
    throw new MobileCmsError("Hygraph is not configured.", 501);
  }

  const res = await fetch(env.HYGRAPH_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.HYGRAPH_API_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as {
    errors?: Array<{ message?: string }>;
  } | null;

  if (!res.ok) {
    throw new MobileCmsError("Hygraph request failed.", 502, {
      status: res.status,
      details: json,
    });
  }

  if (Array.isArray(json?.errors) && json.errors.length > 0) {
    throw new MobileCmsError("Hygraph request failed.", 502, {
      errors: json.errors,
    });
  }

  return json as T;
}

function normalizePageSummaries(
  pages: Array<HygraphPageSummary | null>,
): MobileCmsPageSummary[] {
  return pages
    .filter((page): page is HygraphPageSummary => Boolean(page?.slug))
    .map(normalizePageSummary);
}

function normalizePageDetails(pages: Array<HygraphPage | null>): HygraphPage[] {
  return pages.filter((page): page is HygraphPage => Boolean(page?.slug));
}

function normalizePageSummary(page: HygraphPageSummary): MobileCmsPageSummary {
  const slug = String(page.slug ?? "")
    .trim()
    .toLowerCase();

  return {
    id: String(page.id ?? slug),
    slug,
    title: page.title?.trim() ? page.title.trim() : slug,
    pageType: page.pageType?.trim() ? page.pageType.trim() : null,
    inFooter: Boolean(page.inFooter),
    updatedAt: page.updatedAt ?? null,
  };
}

function normalizePageDetail(page: HygraphPage): MobileCmsPage {
  return {
    ...normalizePageSummary(page),
    seoTitle: page.seo?.title?.trim() ? page.seo.title.trim() : null,
    seoDescription: page.seo?.description?.trim()
      ? page.seo.description.trim()
      : null,
    blocks: normalizeRichText(page.content?.raw),
  };
}

function normalizeRichText(raw: unknown): MobileCmsBlock[] {
  if (!raw || typeof raw !== "object") return [];

  const children = (raw as { children?: unknown }).children;
  if (!Array.isArray(children)) return [];

  return children
    .flatMap((node, index) => normalizeNode(node as HygraphNode, index))
    .filter(Boolean);
}

function normalizeNode(node: HygraphNode, index: number): MobileCmsBlock[] {
  const type = node.type ?? "paragraph";

  switch (type) {
    case "heading-two":
      return buildRunsBlock("heading", collectInlineRuns(node), {
        level: 2 as const,
      });
    case "heading-three":
      return buildRunsBlock("heading", collectInlineRuns(node), {
        level: 3 as const,
      });
    case "heading-four":
      return buildRunsBlock("heading", collectInlineRuns(node), {
        level: 4 as const,
      });
    case "block-quote":
      return buildRunsBlock("quote", collectInlineRuns(node));
    case "bulleted-list":
      return buildListBlock("bulleted", node, index);
    case "numbered-list":
      return buildListBlock("numbered", node, index);
    case "horizontal-rule":
      return [{ type: "divider" }];
    case "image": {
      const url = node.src?.trim();
      if (!url) return [];
      return [
        {
          type: "image",
          url,
          alt: node.altText?.trim() || node.title?.trim() || null,
        },
      ];
    }
    case "paragraph":
    default:
      return buildRunsBlock("paragraph", collectInlineRuns(node));
  }
}

function buildRunsBlock<T extends "heading" | "paragraph" | "quote">(
  type: T,
  runs: MobileCmsTextRun[],
  extra?: T extends "heading" ? { level: 2 | 3 | 4 } : undefined,
): MobileCmsBlock[] {
  if (!hasVisibleText(runs)) return [];

  if (type === "heading") {
    return [
      {
        type,
        level: (extra as { level: 2 | 3 | 4 }).level,
        runs,
      },
    ];
  }

  return [{ type, runs }] as MobileCmsBlock[];
}

function buildListBlock(
  style: "bulleted" | "numbered",
  node: HygraphNode,
  index: number,
): MobileCmsBlock[] {
  const items = collectListItems(node)
    .filter(hasVisibleText)
    .map((runs, itemIndex) => ({
      id: `item-${index}-${itemIndex}`,
      runs,
    }));

  if (items.length === 0) return [];

  return [{ type: "list", style, items }];
}

function collectListItems(node: HygraphNode): MobileCmsTextRun[][] {
  const children = Array.isArray(node.children) ? node.children : [];

  return children
    .filter((child) => child?.type === "list-item")
    .map((child) => collectInlineRuns(child))
    .filter((runs) => runs.length > 0);
}

function collectInlineRuns(
  node: HygraphNode,
  inheritedLink: string | null = null,
): MobileCmsTextRun[] {
  const nextLink =
    node.type === "link" && node.href?.trim()
      ? node.href.trim()
      : inheritedLink;

  if (typeof node.text === "string") {
    return node.text.length === 0
      ? []
      : [
          {
            text: node.text,
            bold: node.bold || undefined,
            italic: node.italic || undefined,
            underline: node.underline || undefined,
            code: node.code || undefined,
            href: nextLink,
          },
        ];
  }

  const children = Array.isArray(node.children) ? node.children : [];
  return children.flatMap((child) => collectInlineRuns(child, nextLink));
}

function hasVisibleText(runs: MobileCmsTextRun[]) {
  return runs.some((run) => run.text.trim().length > 0);
}
