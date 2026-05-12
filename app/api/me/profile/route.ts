import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getApiUserId } from "@/lib/api-auth";
import { resolveAvatarUploadToPublicUrl } from "@/lib/avatar-storage";
import { connectMongoose } from "@/lib/mongoose";
import { getFollowCountsMap } from "@/lib/follow";
import { UserProfile } from "@/models/UserProfile";
import { defaultHandleFromEmail, normalizeHandle } from "@/lib/handle";

const UpdateSchema = z.object({
  handle: z.string().optional(),
  displayName: z.string().optional(),
  avatarUrl: z.string().optional(),
  avatarUploadKey: z.string().optional(),
  privacy: z
    .object({
      showInFeed: z.boolean().optional(),
    })
    .optional(),
  settings: z
    .object({
      emailNotifications: z.boolean().optional(),
    })
    .optional(),
});

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectMongoose();
  const profile = await UserProfile.findOne({ userId }).lean();
  const counts = userId
    ? ((await getFollowCountsMap([userId])).get(userId) ?? {
        followersCount: 0,
        followingCount: 0,
      })
    : { followersCount: 0, followingCount: 0 };
  return NextResponse.json({
    profile: profile
      ? {
          userId: String(profile.userId),
          email: String(profile.email),
          handle: profile.handle ?? null,
          displayName: profile.displayName ?? null,
          avatarUrl: profile.avatarUrl ?? null,
          privacy: profile.privacy ?? { showInFeed: true },
          settings: profile.settings ?? { emailNotifications: false },
          followersCount: counts.followersCount,
          followingCount: counts.followingCount,
        }
      : null,
  });
}

export async function PATCH(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const input = UpdateSchema.safeParse(await req.json());
  if (!input.success)
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  await connectMongoose();

  const existing = await UserProfile.findOne({ userId });
  if (!existing) {
    // Should exist (created on verified sign-in), but be resilient.
    return NextResponse.json(
      { error: "Profile missing. Please sign out and back in." },
      { status: 409 },
    );
  }

  let nextHandle: string | null | undefined = undefined;
  if (typeof input.data.handle === "string") {
    const normalized = normalizeHandle(input.data.handle);
    nextHandle = normalized;

    if (nextHandle) {
      const conflict = await UserProfile.findOne({
        handle: nextHandle,
        userId: { $ne: userId },
      })
        .select({ _id: 1 })
        .lean();
      if (conflict) {
        return NextResponse.json(
          { error: "That handle is taken." },
          { status: 409 },
        );
      }
    }
  }

  const update: Record<string, unknown> = {};
  if (nextHandle !== undefined) update.handle = nextHandle;

  if (typeof input.data.displayName === "string") {
    const v = input.data.displayName.trim().slice(0, 40);
    update.displayName = v.length ? v : null;
  }

  if (typeof input.data.avatarUploadKey === "string") {
    try {
      update.avatarUrl = await resolveAvatarUploadToPublicUrl({
        userId,
        uploadKey: input.data.avatarUploadKey,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Avatar upload could not be verified.",
        },
        { status: 400 },
      );
    }
  } else if (typeof input.data.avatarUrl === "string") {
    const v = input.data.avatarUrl.trim().slice(0, 300);
    update.avatarUrl = v.length ? v : null;
  }

  if (input.data.privacy?.showInFeed !== undefined)
    update["privacy.showInFeed"] = input.data.privacy.showInFeed;
  if (input.data.settings?.emailNotifications !== undefined)
    update["settings.emailNotifications"] =
      input.data.settings.emailNotifications;

  // Ensure handle exists if user clears it.
  if (update.handle === null) {
    const fallback = defaultHandleFromEmail(existing.email);
    if (fallback) update.handle = fallback;
  }

  await UserProfile.updateOne({ userId }, { $set: update });
  const fresh = await UserProfile.findOne({ userId }).lean();
  const counts = userId
    ? ((await getFollowCountsMap([userId])).get(userId) ?? {
        followersCount: 0,
        followingCount: 0,
      })
    : { followersCount: 0, followingCount: 0 };

  return NextResponse.json({
    profile: fresh
      ? {
          userId: String(fresh.userId),
          email: String(fresh.email),
          handle: fresh.handle ?? null,
          displayName: fresh.displayName ?? null,
          avatarUrl: fresh.avatarUrl ?? null,
          privacy: fresh.privacy ?? { showInFeed: true },
          settings: fresh.settings ?? { emailNotifications: false },
          followersCount: counts.followersCount,
          followingCount: counts.followingCount,
        }
      : null,
  });
}
