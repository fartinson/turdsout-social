import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Database
    MONGODB_URI: z.string().min(1),
    MONGODB_DB: z.string().min(1).default("turdsout"),

    // NextAuth/Auth.js
    AUTH_SECRET: z.string().min(1).optional(),
    AUTH_URL: z.string().url().optional(),

    // Resend provider (Auth.js)
    AUTH_RESEND_KEY: z.string().min(1).optional(),
    AUTH_EMAIL_FROM: z.string().email().optional(),

    // Bot prevention
    TURNSTILE_SECRET_KEY: z.string().min(1).optional(),

    // Rate limiting (Upstash)
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY,
    AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  },
  skipValidation: process.env.NODE_ENV === "test",
  emptyStringAsUndefined: true,
});

