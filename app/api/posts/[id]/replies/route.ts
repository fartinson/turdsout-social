import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId, Types } from "mongoose";
import { getApiUserId } from "@/lib/api-auth";
import type { FeedItemAuthorJson } from "@/lib/json-feed-post";
import { validateReplyBody } from "@/lib/content-rules";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { Reply } from "@/models/Reply";
import { UserProfile } from "@/models/UserProfile";
import { rateLimiters } from "@/lib/ratelimit";

type ReplyItemJson = {
  id: string;
  body: string;
  createdAt: string;
  author: FeedItemAuthorJson;
};

function toReplyJson(
  reply: { _id: unknown; body: string; authorUserId: string; createdAt?: Date },
  author: FeedItemAuthorJson,
): ReplyItemJson {
  return {
    id: String(reply._id),
    body: String(reply.body),
    createdAt: reply.createdAt?.toISOString?.() ?? new Date().toISOString(),
    author,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id || !isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 40) || 40, 100);
  const cursor = url.searchParams.get("cursor");

  await connectMongoose();
  const post = await Post.findOne({ _id: id, status: "live" })
    .select({ _id: 1 })
    .lean();
  if (!post) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const filter: Record<string, unknown> = {
    postId: new Types.ObjectId(id),
    /** Live, unknown, or legacy docs without `status`; exclude hidden. */
    status: { $ne: "hidden" },
  };
  if (cursor && isValidObjectId(cursor)) {
    filter._id = { $gt: new Types.ObjectId(cursor) };
  }

  const rows = await Reply.find(filter)
    .sort({ _id: 1 })
    .limit(limit + 1)
    .lean();

  const nextCursor =
    rows.length > limit ? String(rows[limit - 1]?._id) : null;
  const page = rows.slice(0, limit);

  const authorIds = Array.from(
    new Set(page.map((r) => String(r.authorUserId)).filter(Boolean)),
  );
  const profiles = await UserProfile.find({ userId: { $in: authorIds } })
    .select({ userId: 1, handle: 1, avatarUrl: 1 })
    .lean();
  const profileById = new Map(
    profiles.map((p) => [
      String(p.userId),
      {
        userId: String(p.userId),
        handle: p.handle ?? null,
        avatarUrl: p.avatarUrl ?? null,
      },
    ]),
  );

  const items: ReplyItemJson[] = page.map((r) => {
    const author = profileById.get(String(r.authorUserId)) ?? {
      userId: String(r.authorUserId),
      handle: null,
      avatarUrl: null,
    };
    return toReplyJson(r, author);
  });

  return NextResponse.json({ items, nextCursor });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getApiUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const limiter = rateLimiters.createReply;
  if (limiter) {
    const rl = await limiter.limit(`${userId}:${ip ?? "noip"}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Slow down." }, { status: 429 });
    }
  }

  const { id } = await context.params;
  if (!id || !isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const payload = (await req.json()) as { body?: string };
  const validated = validateReplyBody(payload.body ?? "");
  if (!validated.ok) {
    return NextResponse.json({ error: validated.reason }, { status: 400 });
  }

  await connectMongoose();
  const post = await Post.findOne({ _id: id, status: "live" });
  if (!post) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const created = await Reply.create({
    postId: post._id,
    authorUserId: userId,
    body: validated.body,
  });

  await Post.updateOne({ _id: post._id }, { $inc: { replyCount: 1 } });

  const profile = await UserProfile.findOne({ userId: String(userId) })
    .select({ userId: 1, handle: 1, avatarUrl: 1 })
    .lean();

  const author: FeedItemAuthorJson = profile
    ? {
        userId: String(profile.userId),
        handle: profile.handle ?? null,
        avatarUrl: profile.avatarUrl ?? null,
      }
    : {
        userId: String(userId),
        handle: null,
        avatarUrl: null,
      };

  const reply = toReplyJson(created, author);
  return NextResponse.json({ reply }, { status: 201 });
}
