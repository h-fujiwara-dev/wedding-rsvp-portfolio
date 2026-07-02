import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function buildRatelimit(): Ratelimit {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Upstash env vars are not configured.");
  }
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: false,
    prefix: "wedding-rsvp",
  });
}

// Lazily built so missing env vars don't crash at module import time
let _rl: Ratelimit | undefined;
export const ratelimit = {
  limit: (...args: Parameters<Ratelimit["limit"]>) => {
    if (!_rl) _rl = buildRatelimit();
    return _rl.limit(...args);
  },
};
