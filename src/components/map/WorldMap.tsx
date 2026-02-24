import { useMemo, useEffect, useState } from 'react'
import { feature } from 'topojson-client'
import { City } from '../../types'
import { useMapProjection } from '../../hooks/useMapProjection'
import { MapBackground } from './MapBackground'
import { CityMarkers } from './CityMarkers'
import { TerminatorCanvas } from './TerminatorCanvas'

interface WorldMapProps {
  cities: City[]
  baseCity: City
  baseTime: Date
  use12h: boolean
  onCityClick: (city: City) => void
  onSetFormat: (use12h: boolean) => void
}

/**
 * Main world map component.
 * Layers: SVG country polygons → Canvas terminator → SVG city markers
 *
 * World atlas TopoJSON is loaded from /world-110m.json (placed in public/).
 */
export function WorldMap({ cities, baseCity, baseTime, use12h, onCityClick, onSetFormat }: WorldMapProps) {
  const { wrapperRef, size, pathGenerator, project, inverseProject } = useMapProjection()
  const [topoData, setTopoData] = useState<unknown>(null)

  // Load world atlas TopoJSON once
  useEffect(() => {
    fetch('/world-110m.json')
      .then((r) => r.json())
      .then(setTopoData)
      .catch(() => {
        // If the file isn't present, the map still renders — just no country fills
        console.warn('world-110m.json not found. Run: cp node_modules/world-atlas/world/110m.json public/world-110m.json')
      })
  }, [])

  // Convert TopoJSON → GeoJSON features
  const countries = useMemo(() => {
    if (!topoData) return []
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const topo = topoData as any
      const obj = topo.objects.countries ?? topo.objects.land
      if (!obj) return []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (feature(topo, obj) as any).features ?? []
    } catch {
      return []
    }
  }, [topoData])

  return (
    // wrapperRef on the div: ResizeObserver watches this, avoids SVG ref issues
    <div ref={wrapperRef} className="relative flex-1 overflow-hidden bg-[#040609]">
      {/* Subtle radial gradient vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(5,8,13,0.75) 100%)',
        }}
      />

      {/* SVG base layer — country polygons + city markers */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={size.width ? `0 0 ${size.width} ${size.height}` : undefined}
        preserveAspectRatio="xMidYMid slice"
      >
        <MapBackground countries={countries} pathGenerator={pathGenerator} />

        {project && (
          <CityMarkers
            cities={cities}
            baseTime={baseTime}
            activeCity={baseCity}
            project={project}
            use12h={use12h}
            onCityClick={onCityClick}
          />
        )}
      </svg>

      {/* Canvas terminator overlay (day/night boundary) */}
      {project && inverseProject && size.width > 0 && (
        <TerminatorCanvas
          width={size.width}
          height={size.height}
          time={baseTime}
          project={project}
          inverseProject={inverseProject}
        />
      )}

      {/* Top-left: ZoneMap label + 12/24h toggle */}
      <div className="absolute top-4 left-5 z-20 flex items-center gap-3">
        <span className="text-sm font-medium tracking-[0.25em] uppercase text-text-secondary pointer-events-none">
          ZoneMap
        </span>
        <div className="flex rounded-lg overflow-hidden border border-border bg-bg-primary/80 backdrop-blur-sm">
          {(['24h', '12h'] as const).map((label) => {
            const active = (label === '12h') === use12h
            return (
              <button
                key={label}
                onClick={() => onSetFormat(label === '12h')}
                className={`
                  px-3 py-1 text-xs font-medium tracking-wide
                  transition-colors duration-150 cursor-pointer
                  ${active
                    ? 'bg-accent-green text-bg-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                  }
                `}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
