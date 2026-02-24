import { Hono } from 'hono'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface GeoCity {
  n: string  // name
  cc: string // country code
  c: string  // country name
  la: number // latitude
  lo: number // longitude
  tz: string // timezone (IANA)
  p: number  // population
}

// Load dataset at startup (sorted by population desc)
const dataPath = path.join(__dirname, '../data/geonames-cities.json')
let dataset: GeoCity[] = []
try {
  dataset = JSON.parse(readFileSync(dataPath, 'utf8'))
  console.log(`  Loaded ${dataset.length} cities from GeoNames dataset`)
} catch {
  console.warn('  Warning: geonames-cities.json not found. Run: npm run build:geonames')
}

function makeId(name: string, cc: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return `geo-${cc.toLowerCase()}-${slug}`
}

const citiesRouter = new Hono()

citiesRouter.get('/search', (c) => {
  // Sanitize first, then validate length
  const q = (c.req.query('q') ?? '')
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
    .trim()

  if (q.length > 100) {
    return c.json({ error: 'Query too long (max 100 characters)', status: 400 }, 400)
  }

  const parsedLimit = parseInt(c.req.query('limit') ?? '', 10)
  const limit = Math.min(isNaN(parsedLimit) ? 15 : parsedLimit, 50)

  if (!q) return c.json([])

  const results = dataset
    .filter((city) => city.n.toLowerCase().includes(q.toLowerCase()) || city.c.toLowerCase().includes(q.toLowerCase()))
    .slice(0, limit)
    .map((city) => ({
      id: makeId(city.n, city.cc),
      name: city.n,
      country: city.c,
      countryCode: city.cc,
      timezone: city.tz,
      lat: city.la,
      lng: city.lo,
    }))

  return c.json(results)
})

export { citiesRouter }
