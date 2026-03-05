import { City } from '../types'

interface GeoCity {
  n: string  // name
  cc: string // country code
  c: string  // country name
  la: number // latitude
  lo: number // longitude
  tz: string // timezone (IANA)
  p: number  // population
}

function buildBaseId(name: string, cc: string, tz: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const tzSlug = tz.replace(/\//g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()
  return `geo-${cc.toLowerCase()}-${slug}-${tzSlug}`
}

function processDataset(raw: GeoCity[]): City[] {
  const seen = new Set<string>()
  const deduped = raw.filter((c) => {
    const key = `${c.n.toLowerCase()}|${c.cc}|${c.tz}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

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

let cachedCities: City[] | null = null
let loadPromise: Promise<City[]> | null = null

async function loadCities(): Promise<City[]> {
  if (cachedCities) return cachedCities
  if (loadPromise) return loadPromise
  loadPromise = fetch('/geonames-cities.json')
    .then((res) => res.json())
    .then((raw: GeoCity[]) => {
      cachedCities = processDataset(raw)
      return cachedCities
    })
    .catch(() => {
      loadPromise = null
      return []
    })
  return loadPromise
}

export async function searchCities(query: string, limit = 15): Promise<City[]> {
  const cities = await loadCities()
  const q = query.toLowerCase()
  return cities
    .filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))
    .slice(0, limit)
}
