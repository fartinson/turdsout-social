import { NextResponse } from "next/server";
import {
  MobileCmsError,
  fetchMobileCmsPageSummaries,
} from "@/lib/cms/mobile-pages";

export async function GET() {
  try {
    const items = await fetchMobileCmsPageSummaries();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    if (error instanceof MobileCmsError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Could not load CMS pages." },
      { status: 500 },
    );
  }
}
