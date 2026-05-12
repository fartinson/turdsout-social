import { NextResponse, type NextRequest } from "next/server";
import { getApiUserId } from "@/lib/api-auth";
import { toFeedItemJson } from "@/lib/json-feed-post";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { UserProfile } from "@/models/UserProfile";
import { Vote } from "@/models/Vote";
import { Bookmark } from "@/models/Bookmark";
import { validatePostBody } from "@/lib/content-rules";
import { getViewerFollowedUserIds } from "@/lib/follow";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { rateLimiters } from "@/lib/ratelimit";
import {
  isTurnstileTrusted,
  markDeviceTurnstileTrusted,
  setTurnstileTrustedCookie,
  TURNSTILE_TRUST_COOKIE_NAME,
} from "@/lib/turnstile-trust";

export async function GET(req: NextRequest) {
  const viewerId = (await getApiUserId(req)) ?? null;

  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") === "new" ? "new" : "top";
  const scope =
    url.searchParams.get("scope") === "following" ? "following" : "all";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20) || 20, 50);
  const cursor = url.searchParams.get("cursor");

  if (scope === "following" && !viewerId) {
    return NextResponse.json(
      { error: "Sign in to view the Following feed." },
      { status: 401 },
    );
  }

  await connectMongoose();

  const baseQuery: Record<string, unknown> = { status: "live" };
  if (scope === "following" && viewerId) {
    const followedUserIds = await getViewerFollowedUserIds(viewerId);
    if (!followedUserIds.length) {
      return NextResponse.json({ items: [], nextCursor: null });
    }
    baseQuery.authorUserId = { $in: followedUserIds };
  }
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
    .select({ userId: 1, handle: 1, avatarUrl: 1 })
    .lean();
  const profileById = new Map<
    string,
    { userId: string; handle: string | null; avatarUrl: string | null }
  >(
    profiles.map((p) => [
      String(p.userId),
      {
        userId: String(p.userId),
        handle: p.handle ?? null,
        avatarUrl: p.avatarUrl ?? null,
      },
    ]),
  );

  const pagePosts = posts.slice(0, limit);
  const postIds = pagePosts.map((p) => p._id);

  const voteByPostId = new Map<string, 1 | -1>();
  const bookmarkByPostId = new Set<string>();
  if (viewerId && postIds.length) {
    const [votes, bookmarks] = await Promise.all([
      Vote.find({ userId: viewerId, postId: { $in: postIds } })
        .select({ postId: 1, value: 1 })
        .lean(),
      Bookmark.find({ userId: viewerId, postId: { $in: postIds } })
        .select({ postId: 1 })
        .lean(),
    ]);
    for (const v of votes) {
      const id = String(v.postId);
      if (v.value === 1 || v.value === -1) voteByPostId.set(id, v.value);
    }
    for (const b of bookmarks) bookmarkByPostId.add(String(b.postId));
  }

  const items = pagePosts.map((p) => {
    const author = profileById.get(String(p.authorUserId)) ?? {
      userId: String(p.authorUserId),
      handle: null,
      avatarUrl: null,
    };
    return toFeedItemJson(
      p,
      author,
      viewerId ? (voteByPostId.get(String(p._id)) ?? 0) : 0,
      viewerId ? bookmarkByPostId.has(String(p._id)) : false,
    );
  });

  return NextResponse.json({ items, nextCursor });
}

export async function POST(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const limiter = rateLimiters.createPost;
  if (limiter) {
    const rl = await limiter.limit(`${userId}:${ip ?? "noip"}`);
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
    /** Optional: bound device session skips captcha (see turnstile-trust). */
    refreshToken?: string;
  };

  if (body.hp) {
    return NextResponse.json({ error: "Nope." }, { status: 400 });
  }

  const trusted = await isTurnstileTrusted({
    cookieValue: req.cookies.get(TURNSTILE_TRUST_COOKIE_NAME)?.value,
    userId,
    deviceIdHeader: req.headers.get("x-turdsout-device-id"),
    refreshToken:
      typeof body.refreshToken === "string" ? body.refreshToken : undefined,
  });

  if (!trusted) {
    const turnstile = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!turnstile.ok) {
      return NextResponse.json({ error: turnstile.reason }, { status: 400 });
    }
    const deviceId = req.headers.get("x-turdsout-device-id")?.trim();
    if (typeof body.refreshToken === "string" && deviceId) {
      await markDeviceTurnstileTrusted({
        refreshToken: body.refreshToken,
        userId,
        deviceId,
      });
    }
  }

  const validated = validatePostBody(body.body ?? "");
  if (!validated.ok) {
    return NextResponse.json({ error: validated.reason }, { status: 400 });
  }

  await connectMongoose();

  const created = await Post.create({
    authorUserId: userId,
    body: validated.body,
  });

  const profile = await UserProfile.findOne({ userId: String(userId) })
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
    await setTurnstileTrustedCookie(res, userId);
  }
  return res;
}
