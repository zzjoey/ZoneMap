import { useMemo } from 'react'
import { GeoPath, GeoPermissibleObjects } from 'd3-geo'

interface MapBackgroundProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  countries: any[]
  pathGenerator: GeoPath<unknown, GeoPermissibleObjects> | null
}

/**
 * Renders static country polygon SVG paths from TopoJSON feature data.
 * Graticule lines add a subtle coordinate grid.
 */
export function MapBackground({ countries, pathGenerator }: MapBackgroundProps) {
  const paths = useMemo(() => {
    if (!pathGenerator || countries.length === 0) return []
    return countries.map((feature) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: (feature as any).id ?? Math.random().toString(),
      d: pathGenerator(feature) ?? '',
    }))
  }, [countries, pathGenerator])

  if (!pathGenerator) return null

  return (
    <g>
      {/* Country fills */}
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill="#1c2030"
          stroke="#2a2f3e"
          strokeWidth={0.4}
        />
      ))}
    </g>
  )
}
