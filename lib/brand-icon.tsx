import { ImageResponse } from "next/og";

export const BRAND_ICON_BACKGROUND = "#0d4f5c";
export const BRAND_ICON_FOREGROUND = "#ffffff";

const GOOGLE_FONTS_CSS =
  "https://raw.githubusercontent.com/undercasetype/Fraunces/master/fonts/ttf/Fraunces144pt-SemiBold.ttf";

let frauncesFontPromise: Promise<ArrayBuffer> | null = null;

export async function createBrandIconResponse(size: number) {
  const frauncesFont = await loadFrauncesFont();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_ICON_BACKGROUND,
        color: BRAND_ICON_FOREGROUND,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: "Fraunces",
          fontWeight: 700,
          fontSize: Math.round(size * 0.32),
          lineHeight: 0.82,
          letterSpacing: Math.round(size * -0.012),
          transform: "translateY(-2%)",
        }}
      >
        <span>Turds</span>
        <span>Out</span>
      </div>
    </div>,
    {
      width: size,
      height: size,
      fonts: [
        {
          name: "Fraunces",
          data: frauncesFont,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}

export async function createLaunchWordmarkResponse(
  width: number,
  height: number,
) {
  const frauncesFont = await loadFrauncesFont();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        color: BRAND_ICON_FOREGROUND,
        fontFamily: "Fraunces",
        fontWeight: 700,
        fontSize: Math.round(height * 0.74),
        lineHeight: 1,
        letterSpacing: Math.round(height * -0.02),
      }}
    >
      <span>Turdsout</span>
    </div>,
    {
      width,
      height,
      fonts: [
        {
          name: "Fraunces",
          data: frauncesFont,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}

async function loadFrauncesFont() {
  if (!frauncesFontPromise) {
    frauncesFontPromise = fetchGoogleFontArrayBuffer(GOOGLE_FONTS_CSS);
  }

  return frauncesFontPromise;
}

async function fetchGoogleFontArrayBuffer(url: string) {
  const fontResponse = await fetch(url, {
    cache: "force-cache",
  });

  if (!fontResponse.ok) {
    throw new Error("Could not download the Fraunces font file.");
  }

  return fontResponse.arrayBuffer();
}
