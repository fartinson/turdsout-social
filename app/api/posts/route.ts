import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { UserProfile } from "@/models/UserProfile";
import { validatePostBody } from "@/lib/content-rules";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimiters } from "@/lib/ratelimit";
import {
  isTurnstileTrusted,
  setTurnstileTrustedCookie,
  TURNSTILE_TRUST_COOKIE_NAME,
} from "@/lib/turnstile-trust";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") === "new" ? "new" : "top";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20) || 20, 50);
  const cursor = url.searchParams.get("cursor");

  await connectMongoose();

  const baseQuery: Record<string, unknown> = { status: "live" };
  if (cursor) {
    baseQuery._id = { $lt: cursor };
  }

  const sortSpec = sort === "new" ? "-_id" : "-upvotes -_id";

  const posts = await Post.find(baseQuery)
    .sort(sortSpec)
    .limit(limit + 1)
    .lean();
  const nextCursor =
    posts.length > limit ? String(posts[limit - 1]?._id) : null;

  const authorUserIds = Array.from(
    new Set(
      posts
        .slice(0, limit)
        .map((p) => String(p.authorUserId))
        .filter(Boolean),
    ),
  );
  const profiles = await UserProfile.find({ userId: { $in: authorUserIds } })
    .select({ userId: 1, handle: 1 })
    .lean();
  const profileById = new Map<
    string,
    { userId: string; handle: string | null }
  >(
    profiles.map((p) => [
      String(p.userId),
      { userId: String(p.userId), handle: p.handle ?? null },
    ]),
  );

  const items = posts.slice(0, limit).map((p) => ({
    id: String(p._id),
    body: p.body,
    upvotes: p.upvotes ?? 0,
    downvotes: p.downvotes ?? 0,
    createdAt: p.createdAt,
    author: profileById.get(String(p.authorUserId)) ?? {
      userId: String(p.authorUserId),
      handle: null,
    },
  }));

  return NextResponse.json({ items, nextCursor });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const limiter = rateLimiters.createPost;
  if (limiter) {
    const rl = await limiter.limit(`${session.user.id}:${ip ?? "noip"}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Slow down." }, { status: 429 });
    }
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const body = (await req.json()) as {
    body?: string;
    hp?: string;
    turnstileToken?: string;
  };

  if (body.hp) {
    return NextResponse.json({ error: "Nope." }, { status: 400 });
  }

  const trusted = await isTurnstileTrusted({
    cookieValue: req.cookies.get(TURNSTILE_TRUST_COOKIE_NAME)?.value,
    userId: session.user.id,
  });

  if (!trusted) {
    const turnstile = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!turnstile.ok) {
      return NextResponse.json({ error: turnstile.reason }, { status: 400 });
    }
  }

  const validated = validatePostBody(body.body ?? "");
  if (!validated.ok) {
    return NextResponse.json({ error: validated.reason }, { status: 400 });
  }

  await connectMongoose();

  const created = await Post.create({
    authorUserId: session.user.id,
    body: validated.body,
  });

  const profile = await UserProfile.findOne({ userId: String(session.user.id) })
    .select({ handle: 1, avatarUrl: 1 })
    .lean();

  const res = NextResponse.json(
    {
      post: {
        id: String(created._id),
        body: created.body,
        createdAt:
          created.createdAt?.toISOString?.() ?? new Date().toISOString(),
        upvotes: created.upvotes ?? 0,
        downvotes: created.downvotes ?? 0,
        author: {
          handle: profile?.handle ?? null,
          avatarUrl: profile?.avatarUrl ?? null,
        },
      },
    },
    { status: 201 },
  );
  if (!trusted) {
    await setTurnstileTrustedCookie(res, session.user.id);
  }
  return res;
}
