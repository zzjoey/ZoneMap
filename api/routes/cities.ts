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

interface ProcessedCity {
  id: string
  name: string
  country: string
  countryCode: string
  timezone: string
  lat: number
  lng: number
}

function buildBaseId(name: string, cc: string, tz: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const tzSlug = tz.replace(/\//g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()
  return `geo-${cc.toLowerCase()}-${slug}-${tzSlug}`
}

function processDataset(raw: GeoCity[]): ProcessedCity[] {
  // Step 1: Deduplicate by name+cc+tz (dataset is pre-sorted by population desc,
  // so the first occurrence is always the most populous)
  const seen = new Set<string>()
  const deduped = raw.filter((c) => {
    const key = `${c.n.toLowerCase()}|${c.cc}|${c.tz}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Step 2: Assign unique IDs. Slug collisions (e.g. special chars stripped from
  // different names) get a numeric suffix: base, base-2, base-3, ...
  const idCounts = new Map<string, number>()
  return deduped.map((c) => {
    const baseId = buildBaseId(c.n, c.cc, c.tz)
    const count = idCounts.get(baseId) ?? 0
    idCounts.set(baseId, count + 1)
    const id = count === 0 ? baseId : `${baseId}-${count + 1}`
    return {
      id,
      name: c.n,
      country: c.c,
      countryCode: c.cc,
      timezone: c.tz,
      lat: c.la,
      lng: c.lo,
    }
  })
}

// Load and pre-process dataset once at startup
const dataPath = path.join(__dirname, '../data/geonames-cities.json')
let dataset: ProcessedCity[] = []
try {
  const raw: GeoCity[] = JSON.parse(readFileSync(dataPath, 'utf8'))
  dataset = processDataset(raw)
  console.log(`  Loaded ${dataset.length} cities from GeoNames dataset`)
} catch {
  console.warn('  Warning: geonames-cities.json not found. Run: pnpm run build:geonames')
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

  const ql = q.toLowerCase()
  const results = dataset
    .filter((city) => city.name.toLowerCase().includes(ql) || city.country.toLowerCase().includes(ql))
    .slice(0, limit)

  return c.json(results)
})

export { citiesRouter }
