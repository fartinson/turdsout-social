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
