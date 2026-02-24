import { useMemo } from 'react'
import { GeoPath, GeoPermissibleObjects } from 'd3-geo'

interface MapBackgroundProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  countries: any[]
  pathGenerator: GeoPath<unknown, GeoPermissibleObjects> | null
  isDark: boolean
}

/**
 * Renders static country polygon SVG paths from TopoJSON feature data.
 */
export function MapBackground({ countries, pathGenerator, isDark }: MapBackgroundProps) {
  const fill   = isDark ? '#1c2030' : '#ccdde8'
  const stroke = isDark ? '#2a2f3e' : '#a8c0cf'

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
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill={fill}
          stroke={stroke}
          strokeWidth={0.4}
        />
      ))}
    </g>
  )
}
