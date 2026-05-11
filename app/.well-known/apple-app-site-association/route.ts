import { NextResponse } from "next/server";
import { env } from "@/env";

/**
 * Universal Links — set `MOBILE_APPLINKS_APP_ID` to `TEAMID.bundleid` (e.g. `ABCD.com.turdsout.app`).
 * @see https://developer.apple.com/documentation/xcode/supporting-associated-domains
 */
export async function GET() {
  const appId = env.MOBILE_APPLINKS_APP_ID?.trim();
  if (!appId) {
    return NextResponse.json(
      { error: "Mobile applinks not configured." },
      { status: 404 },
    );
  }

  const body = {
    applinks: {
      apps: [] as string[],
      details: [
        {
          appID: appId,
          paths: ["/mobile-auth/*"],
        },
      ],
    },
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
