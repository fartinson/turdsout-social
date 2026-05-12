import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getApiUserId } from "@/lib/api-auth";
import {
  AVATAR_UPLOAD_CONTENT_TYPE,
  AVATAR_UPLOAD_MAX_BYTES,
  avatarUploadsEnabled,
  createAvatarUploadTarget,
} from "@/lib/avatar-storage";

export const runtime = "nodejs";

const RequestSchema = z.object({
  contentType: z.literal(AVATAR_UPLOAD_CONTENT_TYPE),
  fileSizeBytes: z.number().int().positive().max(AVATAR_UPLOAD_MAX_BYTES),
});

export async function POST(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!avatarUploadsEnabled()) {
    return NextResponse.json(
      { error: "Avatar uploads are not configured." },
      { status: 503 },
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const input = RequestSchema.safeParse(await req.json());
  if (!input.success) {
    return NextResponse.json(
      { error: "Invalid avatar upload request." },
      { status: 400 },
    );
  }

  try {
    const target = await createAvatarUploadTarget({
      userId,
      contentType: input.data.contentType,
      fileSizeBytes: input.data.fileSizeBytes,
    });
    return NextResponse.json(target, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create avatar upload target.",
      },
      { status: 400 },
    );
  }
}
