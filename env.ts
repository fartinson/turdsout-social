import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Database
    MONGODB_URI: z.string().min(1),
    MONGODB_DB: z.string().min(1).default("turdsout"),

    // NextAuth/Auth.js
    AUTH_SECRET: z.string().min(1).optional(),
    AUTH_URL: z.string().check(z.url()).optional(),

    // Resend provider (Auth.js)
    AUTH_RESEND_KEY: z.string().min(1).optional(),
    AUTH_EMAIL_FROM: z.string().check(z.email()).optional(),

    // Bot prevention
    TURNSTILE_SECRET_KEY: z.string().min(1).optional(),

    // Rate limiting (Upstash)
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

    // Hygraph (CMS)
    HYGRAPH_API_URL: z.string().url().optional(),
    HYGRAPH_API_TOKEN: z.string().min(1).optional(),

    // Webhooks
    REVALIDATE_WEBHOOK_SECRET: z.string().min(16).optional(),

    /** HS256 signing key for native app access tokens; falls back to AUTH_SECRET. */
    MOBILE_JWT_SECRET: z.string().min(1).optional(),

    /** Sign in with Apple — verify `identityToken` (bundle id / service id). */
    APPLE_CLIENT_ID: z.string().min(1).optional(),

    /** Universal Links: `TEAMID.bundleid` for `/.well-known/apple-app-site-association`. */
    MOBILE_APPLINKS_APP_ID: z.string().min(1).optional(),

    /** Optional comma-separated list of `TEAMID.bundleid` values for multiple mobile targets. */
    MOBILE_APPLINKS_APP_IDS: z.string().min(1).optional(),

    /** AWS region for S3-backed avatar uploads. */
    AWS_REGION: z.string().min(1).optional(),

    /** S3 bucket that stores uploaded avatar images. */
    AVATAR_UPLOAD_BUCKET: z.string().min(1).optional(),

    /** Public base URL for avatar delivery, ideally a CloudFront distribution. */
    AVATAR_PUBLIC_BASE_URL: z.string().url().optional(),

    /** Optional object-key prefix within the avatar upload bucket. */
    AVATAR_UPLOAD_KEY_PREFIX: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  },
  skipValidation: process.env.NODE_ENV === "test",
  emptyStringAsUndefined: true,
});
