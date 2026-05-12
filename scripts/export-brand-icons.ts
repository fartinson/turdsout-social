import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

loadEnvConfig(projectRoot);

const assetsRoot = path.resolve(
  projectRoot,
  "../turdsout-ios/Turdsout/Assets.xcassets",
);
const appIconSetRoot = path.join(assetsRoot, "AppIcon.appiconset");
const launchWordmarkSetRoot = path.join(assetsRoot, "LaunchWordmark.imageset");
const launchBackgroundSetRoot = path.join(
  assetsRoot,
  "LaunchScreenBackground.colorset",
);

const appIconEntries = [
  {
    idiom: "iphone",
    size: "20x20",
    scale: "2x",
    pixelSize: 40,
    filename: "icon-20@2x.png",
  },
  {
    idiom: "iphone",
    size: "20x20",
    scale: "3x",
    pixelSize: 60,
    filename: "icon-20@3x.png",
  },
  {
    idiom: "iphone",
    size: "29x29",
    scale: "2x",
    pixelSize: 58,
    filename: "icon-29@2x.png",
  },
  {
    idiom: "iphone",
    size: "29x29",
    scale: "3x",
    pixelSize: 87,
    filename: "icon-29@3x.png",
  },
  {
    idiom: "iphone",
    size: "40x40",
    scale: "2x",
    pixelSize: 80,
    filename: "icon-40@2x.png",
  },
  {
    idiom: "iphone",
    size: "40x40",
    scale: "3x",
    pixelSize: 120,
    filename: "icon-40@3x.png",
  },
  {
    idiom: "iphone",
    size: "60x60",
    scale: "2x",
    pixelSize: 120,
    filename: "icon-60@2x.png",
  },
  {
    idiom: "iphone",
    size: "60x60",
    scale: "3x",
    pixelSize: 180,
    filename: "icon-60@3x.png",
  },
  {
    idiom: "ios-marketing",
    size: "1024x1024",
    scale: "1x",
    pixelSize: 1024,
    filename: "icon-1024.png",
  },
] as const;

const launchWordmarkEntries = [
  {
    idiom: "universal",
    scale: "2x",
    width: 600,
    height: 144,
    filename: "launch-wordmark@2x.png",
  },
  {
    idiom: "universal",
    scale: "3x",
    width: 900,
    height: 216,
    filename: "launch-wordmark@3x.png",
  },
] as const;

async function main() {
  const {
    BRAND_ICON_BACKGROUND,
    createBrandIconResponse,
    createLaunchWordmarkResponse,
  } = await import("../lib/brand-icon");

  await mkdir(appIconSetRoot, { recursive: true });
  await mkdir(launchWordmarkSetRoot, { recursive: true });
  await mkdir(launchBackgroundSetRoot, { recursive: true });

  await writeFile(
    path.join(assetsRoot, "Contents.json"),
    `${JSON.stringify({ info: { author: "xcode", version: 1 } }, null, 2)}\n`,
    "utf8",
  );

  await Promise.all(
    appIconEntries.map(async (entry) => {
      const response = await createBrandIconResponse(entry.pixelSize);
      const arrayBuffer = await response.arrayBuffer();
      await writeFile(
        path.join(appIconSetRoot, entry.filename),
        Buffer.from(arrayBuffer),
      );
    }),
  );

  await Promise.all(
    launchWordmarkEntries.map(async (entry) => {
      const response = await createLaunchWordmarkResponse(
        entry.width,
        entry.height,
      );
      const arrayBuffer = await response.arrayBuffer();
      await writeFile(
        path.join(launchWordmarkSetRoot, entry.filename),
        Buffer.from(arrayBuffer),
      );
    }),
  );

  await writeFile(
    path.join(appIconSetRoot, "Contents.json"),
    `${JSON.stringify(
      {
        images: appIconEntries.map(({ idiom, size, scale, filename }) => ({
          idiom,
          size,
          scale,
          filename,
        })),
        info: {
          author: "xcode",
          version: 1,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await writeFile(
    path.join(launchWordmarkSetRoot, "Contents.json"),
    `${JSON.stringify(
      {
        images: launchWordmarkEntries.map(({ idiom, scale, filename }) => ({
          idiom,
          scale,
          filename,
        })),
        info: {
          author: "xcode",
          version: 1,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await writeFile(
    path.join(launchBackgroundSetRoot, "Contents.json"),
    `${JSON.stringify(
      {
        colors: [
          {
            idiom: "universal",
            color: {
              "color-space": "srgb",
              components: hexToAssetCatalogComponents(BRAND_ICON_BACKGROUND),
            },
          },
        ],
        info: {
          author: "xcode",
          version: 1,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    `Exported AppIcon asset set to ${path.relative(projectRoot, appIconSetRoot)}`,
  );
  console.log(
    `Exported launch assets to ${path.relative(projectRoot, launchWordmarkSetRoot)}`,
  );
}

main().catch((error) => {
  console.error("Failed to export brand icons.");
  console.error(error);
  process.exitCode = 1;
});

function hexToAssetCatalogComponents(hex: string) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    throw new Error(`Expected a 6-character hex color, received "${hex}".`);
  }

  const toComponent = (offset: number) =>
    (parseInt(normalized.slice(offset, offset + 2), 16) / 255).toFixed(3);

  return {
    alpha: "1.000",
    blue: toComponent(4),
    green: toComponent(2),
    red: toComponent(0),
  };
}
