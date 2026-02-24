import { InverseProjectFn, ProjectFn } from '../types'

const DEG = Math.PI / 180

/**
 * Compute solar declination (radians) for a given UTC date.
 * Uses simplified USNO algorithm — sufficient for UI purposes.
 */
function getSolarDeclination(date: Date): number {
  // Days since J2000.0 epoch (Jan 1, 2000 12:00 UTC)
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0)
  const d = (date.getTime() - J2000) / 86400000

  // Mean longitude of the sun (degrees)
  const L = (280.46 + 0.9856474 * d) % 360

  // Mean anomaly (degrees → radians)
  const g = (357.528 + 0.9856003 * d) * DEG

  // Ecliptic longitude (radians)
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG

  // Obliquity of the ecliptic (radians) — approx constant
  const epsilon = 23.439 * DEG

  // Declination
  return Math.asin(Math.sin(epsilon) * Math.sin(lambda))
}


/**
 * Returns true if the sun is above the horizon at the given lat/lng,
 * using the same solar model as drawTerminator for consistency.
 */
export function isCityDaytime(date: Date, lat: number, lng: number): boolean {
  const decl = getSolarDeclination(date)
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  const H_rad = (utcHours * 15 + lng - 180) * DEG
  const latRad = lat * DEG
  const cosZ = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(H_rad)
  return cosZ >= 0
}


/**
 * Draw the day/night terminator overlay onto a Canvas element.
 *
 * For each pixel, we compute cos(solar zenith angle):
 *   cosZ = sin(lat)·sin(δ) + cos(lat)·cos(δ)·cos(H)
 * where cosZ < 0 means night.
 *
 * Performance: Mercator is a cylindrical projection — longitude depends only
 * on the pixel column, and latitude depends only on the pixel row. We
 * precompute per-column cos(H) and per-row sin/cos(lat) with O(W+H) inverse-
 * projection calls, then the inner loop is pure multiply-add with no
 * transcendental functions. This is ~500× faster than calling inverseProject
 * for every pixel.
 */
export function drawTerminator(
  canvas: HTMLCanvasElement,
  date: Date,
  _project: ProjectFn,
  inverseProject: InverseProjectFn,
  isDark = true
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = canvas
  if (!width || !height) return

  const decl = getSolarDeclination(date)
  const sinDecl = Math.sin(decl)
  const cosDecl = Math.cos(decl)
  const utcHours =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600

  // --- Precompute per-column: cos(hour_angle) ---
  // Longitude is purely a function of x in any cylindrical projection.
  // NaN sentinel = outside the projection clip region.
  const cosHByCol = new Float32Array(width)
  for (let px = 0; px < width; px++) {
    const lonLat = inverseProject(px, height / 2)
    if (!lonLat) { cosHByCol[px] = NaN; continue }
    const H_rad = (utcHours * 15 + lonLat[0] - 180) * DEG
    cosHByCol[px] = Math.cos(H_rad)
  }

  // --- Precompute per-row: sin(lat) and cos(lat) ---
  // Latitude is purely a function of y in any cylindrical projection.
  const sinLatByRow = new Float32Array(height)
  const cosLatByRow = new Float32Array(height)
  const validRow = new Uint8Array(height)
  for (let py = 0; py < height; py++) {
    const lonLat = inverseProject(width / 2, py)
    if (!lonLat) continue
    const latRad = lonLat[1] * DEG
    sinLatByRow[py] = Math.sin(latRad)
    cosLatByRow[py] = Math.cos(latRad)
    validRow[py] = 1
  }

  // Twilight range: cosZ = 0 at the terminator, reaches full night at this value
  // (~7° below horizon ≈ civil/nautical twilight boundary)
  const twilightRange = 0.12
  // Dark mode: deep near-black navy (multiply blend).
  // Light mode: neutral cool gray (normal blend) — light, barely-there tint.
  const [nightR, nightG, nightB, maxAlpha] = isDark
    ? [5,  8,  25, 170]
    : [65, 72, 82,  50]
  const invTwilight = maxAlpha / twilightRange

  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  for (let py = 0; py < height; py++) {
    if (!validRow[py]) continue
    const sinLat = sinLatByRow[py]
    // Hoist the row-constant terms out of the inner loop
    const sinLatSinDecl = sinLat * sinDecl
    const cosLatCosDecl = cosLatByRow[py] * cosDecl
    const rowBase = py * width * 4

    for (let px = 0; px < width; px++) {
      const cosH = cosHByCol[px]
      if (cosH !== cosH) continue // NaN check — outside clip

      const cosZ = sinLatSinDecl + cosLatCosDecl * cosH
      if (cosZ >= 0) continue // daytime

      const alpha = Math.round(Math.min(maxAlpha, -cosZ * invTwilight))
      if (alpha <= 0) continue

      const idx = rowBase + px * 4
      data[idx]     = nightR
      data[idx + 1] = nightG
      data[idx + 2] = nightB
      data[idx + 3] = alpha
    }
  }

  ctx.putImageData(imageData, 0, 0)
}
