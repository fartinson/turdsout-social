import { NextResponse, type NextRequest } from "next/server";
import { getApiUserId } from "@/lib/api-auth";

/** Lightweight session check for native app boot. */
export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) {
    return NextResponse.json({ userId: null }, { status: 401 });
  }
  return NextResponse.json({ userId });
}
