import { NextResponse, type NextRequest } from "next/server";
import { getApiUserId } from "@/lib/api-auth";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { Report } from "@/models/Report";
import { rateLimiters } from "@/lib/ratelimit";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getApiUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const limiter = rateLimiters.report;
  if (limiter) {
    const rl = await limiter.limit(`${userId}:${ip ?? "noip"}`);
    if (!rl.success)
      return NextResponse.json({ error: "Slow down." }, { status: 429 });
  }

  const { id } = await context.params;
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const payload = (await req.json()) as { reason?: string };
  const reason = String(payload.reason ?? "")
    .trim()
    .slice(0, 200);
  if (!reason)
    return NextResponse.json({ error: "Missing reason." }, { status: 400 });

  await connectMongoose();

  const post = await Post.findById(id);
  if (!post || post.status !== "live")
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await Report.create({
      postId: post._id,
      reporterUserId: userId,
      reason,
    });
  } catch {
    return NextResponse.json({ ok: true, alreadyReported: true });
  }

  post.reports = (post.reports ?? 0) + 1;
  await post.save();

  return NextResponse.json({ ok: true });
}
