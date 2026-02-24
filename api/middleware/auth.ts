import { MiddlewareHandler } from 'hono'
import { timingSafeEqual, createHash } from 'crypto'

// Parse once at startup — env vars are static
const validKeys = (process.env.API_KEYS ?? '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean)

function hashKey(key: string): Buffer {
  return createHash('sha256').update(key).digest()
}

// Pre-hash all valid keys at startup for constant-time comparison
const hashedValidKeys = validKeys.map(hashKey)

/**
 * Validates X-API-Key header against comma-separated API_KEYS env var.
 * Uses SHA-256 + timingSafeEqual for constant-time comparison to prevent timing attacks.
 * If API_KEYS is not configured, all requests are allowed (dev mode).
 */
export const apiKeyAuth: MiddlewareHandler = async (c, next) => {
  // If no keys configured (e.g. local dev without .env), allow all
  if (hashedValidKeys.length === 0) {
    await next()
    return
  }

  const provided = c.req.header('X-API-Key') ?? ''
  const hashedProvided = hashKey(provided)

  const isValid = hashedValidKeys.some((hashed) => timingSafeEqual(hashed, hashedProvided))
  if (!isValid) {
    return c.json({ error: 'Unauthorized', status: 401 }, 401)
  }

  await next()
}
