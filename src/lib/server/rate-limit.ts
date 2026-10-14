import "server-only";
import { ApiError } from "./errors";
import { getServerConfig } from "./config";

const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

/**
 * Best-effort fixed-window limiter. State is per server instance, which is enough to
 * blunt casual abuse of a public demo; use a shared store (e.g. Redis) for strict limits.
 */
export function enforceRateLimit(request: Request, cost = 1): void {
  const limit = getServerConfig().rateLimitPerMinute;
  const key = clientKey(request);
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: cost, resetAt: now + WINDOW_MS });
  } else {
    bucket.count += cost;
    if (bucket.count > limit) {
      const seconds = Math.ceil((bucket.resetAt - now) / 1000);
      throw new ApiError(429, "rate_limited", `Too many requests. Try again in ${seconds}s.`);
    }
  }
  if (buckets.size > 5_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
}
