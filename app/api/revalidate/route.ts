import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { env } from "@/env";
import { routes } from "@/lib/routes";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret") ?? "";
  if (!env.REVALIDATE_WEBHOOK_SECRET || secret !== env.REVALIDATE_WEBHOOK_SECRET) {
    return unauthorized();
  }

  const body = (await req.json().catch(() => null)) as
    | {
        slug?: string | null;
        path?: string | null;
        tags?: string[] | null;
        data?: { slug?: string | null } | null; // Hygraph webhook payload shape
      }
    | null;

  const slugRaw =
    typeof body?.slug === "string"
      ? body.slug
      : typeof body?.data?.slug === "string"
        ? body.data.slug
        : null;
  const slug = slugRaw ? slugRaw.trim().toLowerCase() : null;
  const explicitPath = typeof body?.path === "string" ? body.path : null;
  const tags = Array.isArray(body?.tags) ? body?.tags.filter((t): t is string => typeof t === "string") : [];

  if (explicitPath) revalidatePath(explicitPath);
  for (const tag of tags) revalidateTag(tag, "max");

  if (slug) {
    revalidatePath(routes.page(slug));
    revalidateTag("hygraph-page", "max");
    revalidateTag(`hygraph-page:${slug}`, "max");
  }

  return NextResponse.json({ ok: true });
}

