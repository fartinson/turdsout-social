import { env } from "@/env";

export function getAppBaseUrl() {
  if (env.AUTH_URL) return env.AUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
