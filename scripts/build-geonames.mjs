#!/usr/bin/env node
/**
 * Downloads and processes the GeoNames cities15000 dataset.
 * Outputs api/data/geonames-cities.json (~2MB, 26k cities, population > 15,000).
 *
 * Usage: node scripts/build-geonames.mjs
 * Data source: https://www.geonames.org  (CC BY 4.0)
 */
import https from 'https'
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import AdmZip from 'adm-zip'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_FILE = path.join(__dirname, '../api/data/geonames-cities.json')

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchBuffer(res.headers.location).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    req.on('error', reject)
  })
}

const fetchText = (url) => fetchBuffer(url).then((b) => b.toString('utf8'))

// ---------------------------------------------------------------------------
// Parse GeoNames countryInfo.txt → { 'US': 'United States', ... }
// ---------------------------------------------------------------------------
async function fetchCountryNames() {
  console.log('  Fetching countryInfo.txt...')
  const text = await fetchText('https://download.geonames.org/export/dump/countryInfo.txt')
  const map = {}
  for (const line of text.split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue
    const cols = line.split('\t')
    // ISO: cols[0], Country name: cols[4]
    if (cols.length >= 5 && cols[0] && cols[4]) {
      map[cols[0]] = cols[4]
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Building GeoNames city data…')

  const countryNames = await fetchCountryNames()

  console.log('  Downloading cities15000.zip (~6 MB)…')
  const zipBuf = await fetchBuffer('https://download.geonames.org/export/dump/cities15000.zip')

  console.log('  Extracting…')
  const zip = new AdmZip(zipBuf)
  const entry = zip.getEntry('cities15000.txt')
  if (!entry) throw new Error('cities15000.txt not found in ZIP')
  const tsv = entry.getData().toString('utf8')

  console.log('  Parsing…')
  // TSV columns: geonameid(0) name(1) asciiname(2) altnames(3) lat(4) lng(5)
  //   feature_class(6) feature_code(7) country_code(8) cc2(9)
  //   admin1(10) admin2(11) admin3(12) admin4(13) population(14)
  //   elevation(15) dem(16) timezone(17) modified(18)
  const cities = []
  for (const line of tsv.split('\n')) {
    if (!line.trim()) continue
    const cols = line.split('\t')
    if (cols.length < 18) continue

    const name = cols[1]?.trim()
    const lat  = parseFloat(cols[4])
    const lng  = parseFloat(cols[5])
    const cc   = cols[8]?.trim()
    const pop  = parseInt(cols[14]) || 0
    const tz   = cols[17]?.trim()

    if (!name || !tz || !cc || isNaN(lat) || isNaN(lng)) continue

    cities.push({
      n:  name,
      cc: cc,
      c:  countryNames[cc] ?? cc,
      la: Math.round(lat * 1000) / 1000,
      lo: Math.round(lng * 1000) / 1000,
      tz: tz,
      p:  pop,
    })
  }

  // Sort largest cities first so search results prioritise major cities
  cities.sort((a, b) => b.p - a.p)

  mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, JSON.stringify(cities))

  const kb = Math.round(Buffer.byteLength(JSON.stringify(cities)) / 1024)
  console.log(`✓ ${cities.length} cities → ${OUT_FILE} (${kb} KB)`)
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
