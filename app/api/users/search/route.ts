import { NextResponse, type NextRequest } from "next/server";
import { getApiUserId } from "@/lib/api-auth";
import { connectMongoose } from "@/lib/mongoose";
import { UserProfile } from "@/models/UserProfile";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const limit = Math.min(Number(url.searchParams.get("limit") ?? 8) || 8, 15);
  const esc = escapeRegExp(q);
  const regex = new RegExp(esc, "i");

  await connectMongoose();

  const users = await UserProfile.find({
    userId: { $ne: String(userId) },
    $or: [{ handle: regex }, { displayName: regex }],
  })
    .select({ userId: 1, handle: 1, displayName: 1 })
    .sort({ handle: 1 })
    .limit(limit)
    .lean();

  return NextResponse.json({
    users: users.map((u) => ({
      userId: String(u.userId),
      handle: u.handle ?? null,
      displayName: u.displayName ?? null,
    })),
  });
}
