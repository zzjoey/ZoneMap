import { MiddlewareHandler } from 'hono'

// IP → array of request timestamps (ms) within the current window
const store = new Map<string, number[]>()

// Parse once at startup with NaN guard
const parsed = parseInt(process.env.RATE_LIMIT_RPM ?? '60', 10)
const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 60
const windowMs = 60_000

/**
 * Sliding window IP rate limiter.
 * Reads RATE_LIMIT_RPM env var (default 60 req/min).
 * Returns 429 with Retry-After header when limit is exceeded.
 *
 * Note: x-forwarded-for is caller-controlled — trust only when behind a
 * trusted reverse proxy that strips or overwrites this header.
 */
export const rateLimit: MiddlewareHandler = async (c, next) => {
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
    c.req.header('x-real-ip') ??
    'unknown'

  const now = Date.now()
  const timestamps = (store.get(ip) ?? []).filter((t) => now - t < windowMs)

  if (timestamps.length >= limit) {
    // Write filtered timestamps back so stale entries are evicted even when blocking
    store.set(ip, timestamps)
    c.header('Retry-After', '60')
    return c.json({ error: 'Too many requests', status: 429 }, 429)
  }

  // Clean up store entry if no recent timestamps remain (evicts stale IPs)
  if (timestamps.length === 0) {
    store.delete(ip)
  }

  timestamps.push(now)
  store.set(ip, timestamps)

  await next()
}
