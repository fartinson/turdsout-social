import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

loadEnvConfig(projectRoot);

const DEFAULT_OUTPUT_PATH = path.resolve(
  projectRoot,
  "../turdsout-ios/Turdsout/Resources/CmsPages.json",
);

function readOutputArg() {
  const outputFlagIndex = process.argv.findIndex((arg) => arg === "--output");
  if (outputFlagIndex === -1) return DEFAULT_OUTPUT_PATH;

  const explicitPath = process.argv[outputFlagIndex + 1];
  return explicitPath
    ? path.resolve(process.cwd(), explicitPath)
    : DEFAULT_OUTPUT_PATH;
}

async function main() {
  const outputPath = readOutputArg();
  const { fetchMobileCmsBundle } = await import("../lib/cms/mobile-pages");
  const bundle = await fetchMobileCmsBundle();

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");

  console.log(
    `Exported ${bundle.items.length} CMS page(s) to ${path.relative(projectRoot, outputPath)}`,
  );
}

main().catch((error) => {
  console.error("Failed to export mobile CMS pages.");
  console.error(error);
  process.exitCode = 1;
});
