import { NextResponse, type NextRequest } from "next/server";
import {
  MobileCmsError,
  fetchMobileCmsPageBySlug,
  isSafeCmsSlug,
} from "@/lib/cms/mobile-pages";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const normalized = (slug ?? "").trim().toLowerCase();

  if (!normalized || !isSafeCmsSlug(normalized)) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  try {
    const page = await fetchMobileCmsPageBySlug(normalized);

    if (!page) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    return NextResponse.json({ page }, { status: 200 });
  } catch (error) {
    if (error instanceof MobileCmsError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Could not load CMS page." },
      { status: 500 },
    );
  }
}
