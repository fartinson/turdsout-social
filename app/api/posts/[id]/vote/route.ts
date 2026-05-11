import { NextResponse, type NextRequest } from "next/server";
import { getApiUserId } from "@/lib/api-auth";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { Vote } from "@/models/Vote";
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
  const limiter = rateLimiters.vote;
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

  const payload = (await req.json()) as { value?: number };
  const value = payload.value === -1 ? -1 : 1;

  await connectMongoose();

  const post = await Post.findById(id);
  if (!post || post.status !== "live")
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await Vote.findOne({
    postId: post._id,
    userId,
  });
  if (existing) {
    if (existing.value === value) {
      return NextResponse.json({ ok: true, unchanged: true });
    }
    existing.value = value;
    await existing.save();
  } else {
    await Vote.create({ postId: post._id, userId, value });
  }

  const agg = await Vote.aggregate([
    { $match: { postId: post._id } },
    {
      $group: {
        _id: "$postId",
        up: { $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] } },
        down: { $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] } },
      },
    },
  ]);
  const upvotes = agg[0]?.up ?? 0;
  const downvotes = agg[0]?.down ?? 0;
  post.upvotes = upvotes;
  post.downvotes = downvotes;
  await post.save();

  return NextResponse.json({ ok: true, upvotes, downvotes });
}
