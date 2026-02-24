import { ProjectFn, InverseProjectFn } from '../types'
import { geoMercator, geoPath } from 'd3-geo'

/**
 * Create a d3-geo Mercator projection for the given map dimensions.
 * Returns the project function, inverse project function, and path generator.
 */
export function createMercatorProjection(width: number, height: number) {
  const projection = geoMercator()
    // Scale so the whole world fits in width
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2])
    // Center slightly north so Antarctica doesn't dominate
    .center([0, 15])
    // Clip to valid Mercator range
    .clipExtent([[0, 0], [width, height]])

  const pathGenerator = geoPath(projection)

  const project: ProjectFn = (lonLat) => {
    const result = projection(lonLat)
    return result ?? null
  }

  const inverseProject: InverseProjectFn = (x, y) => {
    const result = projection.invert?.([x, y])
    return result ?? null
  }

  return { projection, pathGenerator, project, inverseProject }
}

/**
 * Simple equirectangular projection (fallback / Canvas terminator use).
 * Maps [lng, lat] → [x, y] pixel coordinates for a canvas of given size.
 */
export function equirectProject(
  lng: number,
  lat: number,
  width: number,
  height: number
): [number, number] {
  const x = ((lng + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return [x, y]
}

/**
 * Reverse equirectangular: pixel [x, y] → [lng, lat].
 */
export function equirectInverse(
  x: number,
  y: number,
  width: number,
  height: number
): [number, number] {
  const lng = (x / width) * 360 - 180
  const lat = 90 - (y / height) * 180
  return [lng, lat]
}
