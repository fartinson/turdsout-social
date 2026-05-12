import { NextResponse } from "next/server";
import { env } from "@/env";

/**
 * Universal Links — set `MOBILE_APPLINKS_APP_ID` or `MOBILE_APPLINKS_APP_IDS`
 * to one or more `TEAMID.bundleid` values once the final Apple team is chosen.
 * @see https://developer.apple.com/documentation/xcode/supporting-associated-domains
 */
export async function GET() {
  const appIds = getConfiguredAppIds();
  if (appIds.length === 0) {
    return NextResponse.json(
      { error: "Mobile applinks not configured." },
      { status: 404 },
    );
  }

  const body = {
    applinks: {
      apps: [] as string[],
      details: appIds.map((appID) => ({
        appID,
        paths: ["/t/*"],
      })),
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

function getConfiguredAppIds() {
  return Array.from(
    new Set(
      [env.MOBILE_APPLINKS_APP_IDS, env.MOBILE_APPLINKS_APP_ID]
        .filter(Boolean)
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}
