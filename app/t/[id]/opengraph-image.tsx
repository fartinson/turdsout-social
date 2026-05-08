import { ImageResponse } from "next/og";
import { isValidObjectId } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { UserProfile } from "@/models/UserProfile";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function trunc(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1220",
          color: "white",
          fontSize: 64,
          fontWeight: 800,
        }}
      >
        Turdsout
      </div>,
      size,
    );
  }

  await connectMongoose();
  const post = await Post.findOne({ _id: id, status: "live" }).lean();

  const body = post?.body ? trunc(post.body, 180) : "Turdsout…";
  const authorUserId = post?.authorUserId ? String(post.authorUserId) : null;
  const profile = authorUserId
    ? await UserProfile.findOne({ userId: authorUserId })
        .select({ handle: 1 })
        .lean()
    : null;
  const author = profile?.handle ? `@${profile.handle}` : "Anonymous Turd";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background:
          "linear-gradient(135deg, #06141b 0%, #0b2b31 45%, #0d4f5c 100%)",
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            background: "#14b8a6",
          }}
        />
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -0.5 }}>
          Turdsout
        </div>
      </div>

      <div
        style={{
          fontSize: 54,
          lineHeight: 1.12,
          fontWeight: 800,
          letterSpacing: -1,
          whiteSpace: "pre-wrap",
        }}
      >
        {body}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 34,
          opacity: 0.95,
        }}
      >
        <div>{author}</div>
        <div style={{ opacity: 0.85 }}>turdsout.com</div>
      </div>
    </div>,
    size,
  );
}

