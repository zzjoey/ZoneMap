import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { citiesRouter } from './routes/cities.js'
import { apiKeyAuth } from './middleware/auth.js'
import { rateLimit } from './middleware/rateLimit.js'

const app = new Hono()

// 1. Security headers
app.use('*', secureHeaders())

// 2. CORS — restrict to allowed origins in production
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
  '*',
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

// 3. API key auth
app.use('*', apiKeyAuth)

// 4. Rate limiting
app.use('*', rateLimit)

// Routes
app.route('/api/cities', citiesRouter)

const port = 3001
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API server running at http://localhost:${info.port}`)
})
