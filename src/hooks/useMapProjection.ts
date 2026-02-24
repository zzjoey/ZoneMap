import { useRef, useState, useEffect, useMemo } from 'react'
import { createMercatorProjection } from '../utils/mapUtils'
import { ProjectFn, InverseProjectFn, MapSize } from '../types'
import type { GeoPath, GeoPermissibleObjects } from 'd3-geo'

interface MapProjection {
  // Attach to a wrapper div — ResizeObserver watches the div, SVG fills it
  wrapperRef: React.RefObject<HTMLDivElement>
  size: MapSize
  pathGenerator: GeoPath<unknown, GeoPermissibleObjects> | null
  project: ProjectFn | null
  inverseProject: InverseProjectFn | null
}

/**
 * Manages a d3-geo Mercator projection that automatically
 * updates whenever the wrapper div is resized.
 */
export function useMapProjection(): MapProjection {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<MapSize>({ width: 0, height: 0 })

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ width: Math.round(width), height: Math.round(height) })
    })

    observer.observe(el)

    const rect = el.getBoundingClientRect()
    if (rect.width > 0) {
      setSize({ width: Math.round(rect.width), height: Math.round(rect.height) })
    }

    return () => observer.disconnect()
  }, [])

  const { pathGenerator, project, inverseProject } = useMemo(() => {
    if (!size.width || !size.height) {
      return { pathGenerator: null, project: null, inverseProject: null }
    }
    return createMercatorProjection(size.width, size.height)
  }, [size.width, size.height])

  return { wrapperRef, size, pathGenerator, project, inverseProject }
}
