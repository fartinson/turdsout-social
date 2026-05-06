import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { Bookmark } from "@/models/Bookmark";
import { rateLimiters } from "@/lib/ratelimit";

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = _req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const limiter = rateLimiters.bookmark;
  if (limiter) {
    const rl = await limiter.limit(`${session.user.id}:${ip ?? "noip"}`);
    if (!rl.success) return NextResponse.json({ error: "Slow down." }, { status: 429 });
  }

  const { id } = await context.params;

  await connectMongoose();

  const post = await Post.findById(id);
  if (!post || post.status !== "live") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await Bookmark.findOne({ postId: post._id, userId: session.user.id });
  if (existing) {
    await existing.deleteOne();
    return NextResponse.json({ ok: true, bookmarked: false });
  }

  await Bookmark.create({ postId: post._id, userId: session.user.id });
  return NextResponse.json({ ok: true, bookmarked: true });
}
