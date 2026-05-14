import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

function getRedis() {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const redis = getRedis();

export const rateLimiters = {
  authEmail: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        analytics: true,
        prefix: "rl:auth",
      })
    : null,
  createPost: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        analytics: true,
        prefix: "rl:post",
      })
    : null,
  vote: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "10 m"),
        analytics: true,
        prefix: "rl:vote",
      })
    : null,
  report: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "10 m"),
        analytics: true,
        prefix: "rl:report",
      })
    : null,
  bookmark: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(40, "10 m"),
        analytics: true,
        prefix: "rl:bookmark",
      })
    : null,
  createReply: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(12, "10 m"),
        analytics: true,
        prefix: "rl:reply",
      })
    : null,
};
