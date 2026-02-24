import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { citiesRouter } from './routes/cities.js'
import { apiKeyAuth } from './middleware/auth.js'
import { rateLimit } from './middleware/rateLimit.js'

const app = new Hono()

// 1. Security headers (all routes)
app.use('*', secureHeaders())

// 2. CORS — only needed for API routes
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

if (process.env.API_KEYS && allowedOrigins.length === 0) {
  console.warn(
    'Warning: API_KEYS is configured but ALLOWED_ORIGINS is not set — CORS is open to all origins'
  )
}

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) return null
      // Always allow localhost in development
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return origin
      }
      if (allowedOrigins.length === 0) return origin
      return allowedOrigins.includes(origin) ? origin : null
    },
    allowHeaders: ['X-API-Key', 'Content-Type'],
  })
)

// 3. API key auth + rate limiting (API routes only)
app.use('/api/*', apiKeyAuth)
app.use('/api/*', rateLimit)

// 4. API routes
app.route('/api/cities', citiesRouter)

// 5. Serve frontend static files (production build in dist/)
app.use('*', serveStatic({ root: './dist' }))

// 6. SPA fallback — return index.html for all unmatched routes (client-side routing)
app.use('*', serveStatic({ path: './dist/index.html' }))

const port = parseInt(process.env.PORT ?? '3001', 10)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`)
})
