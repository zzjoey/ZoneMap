import { useMemo, useEffect, useState, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { feature } from 'topojson-client'
import { City, ThemeMode } from '../../types'
import { useMapProjection } from '../../hooks/useMapProjection'
import { MapBackground } from './MapBackground'
import { CityMarkers } from './CityMarkers'
import { TerminatorCanvas } from './TerminatorCanvas'
import { AboutModal } from './AboutModal'
import { ProductHuntModal } from './ProductHuntModal'
import { drawTerminator } from '../../utils/terminator'

interface WorldMapProps {
  cities: City[]
  baseCity: City
  baseTime: Date
  use12h: boolean
  isDark: boolean
  useAnalog: boolean
  themeMode: ThemeMode
  onCityClick: (city: City) => void
  onSetFormat: (use12h: boolean) => void
  onSetAnalog: (v: boolean) => void
  onSetTheme: (mode: ThemeMode) => void
  onTimeChange: (date: Date) => void
}

/**
 * Main world map component.
 * Layers: SVG country polygons → Canvas terminator → SVG city markers
 *
 * Dragging the map horizontally shifts time: the terminator (day/night boundary)
 * moves with the drag. 1 full map width = 360° = 24 hours = 1440 minutes.
 *
 * During drag, drawTerminator is called directly on the canvas element (bypassing
 * React's render cycle) for zero-latency visual feedback — same technique as the
 * TimeSlider's direct DOM transform during scrubbing.
 *
 * World atlas TopoJSON is loaded from /world-110m.json (placed in public/).
 */
export function WorldMap({ cities, baseCity, baseTime, use12h, isDark, useAnalog, themeMode, onCityClick, onSetFormat, onSetAnalog, onSetTheme, onTimeChange }: WorldMapProps) {
  const { wrapperRef, size, pathGenerator, project, inverseProject } = useMapProjection()

  const [topoData, setTopoData] = useState<unknown>(null)
  const [showAbout, setShowAbout] = useState(false)
  const [showPH, setShowPH] = useState(() => !localStorage.getItem('ph_dismissed'))

  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false)
  const formatDropdownRef = useRef<HTMLDivElement>(null)
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false)
  const themeDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    if (!formatDropdownOpen) return
    function handleOutside(e: MouseEvent) {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(e.target as Node)) {
        setFormatDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [formatDropdownOpen])

  useEffect(() => {
    if (!themeDropdownOpen) return
    function handleOutside(e: MouseEvent) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [themeDropdownOpen])

  // ── Drag-to-time refs ───────────────────────────────────────────────────
  const isDragging        = useRef(false)
  const dragStartX        = useRef(0)
  const dragStartTime     = useRef<Date>(new Date())
  // Direct ref to the canvas element for imperative redraws during drag
  const terminatorCanvasRef = useRef<HTMLCanvasElement>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('button, a')) return
    isDragging.current    = true
    dragStartX.current    = e.clientX
    dragStartTime.current = baseTime
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }, [baseTime])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !size.width) return
    const dx = e.clientX - dragStartX.current

    // 1440 min = 360° = full map width → drag left = time forward
    const minutesDelta = -(dx / size.width) * 1440
    const newDate = new Date(dragStartTime.current.getTime() + minutesDelta * 60_000)

    // Draw the terminator directly on the canvas — no React render cycle,
    // no CSS transform edge-clipping issues, content always complete and correct.
    const canvas = terminatorCanvasRef.current
    if (canvas && project && inverseProject) {
      drawTerminator(canvas, newDate, project, inverseProject, isDark)
    }

    onTimeChange(newDate)
  }, [size.width, project, inverseProject, isDark, onTimeChange])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  // Load world atlas TopoJSON once
  useEffect(() => {
    fetch('/world-110m.json')
      .then((r) => r.json())
      .then(setTopoData)
      .catch(() => {
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
    <div
      ref={wrapperRef}
      className="relative flex-1 overflow-hidden cursor-ew-resize select-none"
      style={{ background: 'rgb(var(--map-ocean))', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Subtle radial gradient vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgb(var(--map-vignette) / 0.75) 100%)',
        }}
      />

      {/* SVG base layer — country polygons + city markers */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={size.width ? `0 0 ${size.width} ${size.height}` : undefined}
      >
        <MapBackground countries={countries} pathGenerator={pathGenerator} isDark={isDark} />

        {project && (
          <CityMarkers
            cities={cities}
            baseTime={baseTime}
            activeCity={baseCity}
            project={project}
            use12h={use12h}
            mapWidth={size.width}
            mapHeight={size.height}
            isDark={isDark}
            onCityClick={onCityClick}
          />
        )}
      </svg>

      {/* Canvas terminator overlay — ref forwarded for direct draw during drag */}
      {project && inverseProject && size.width > 0 && (
        <TerminatorCanvas
          ref={terminatorCanvasRef}
          width={size.width}
          height={size.height}
          time={baseTime}
          project={project}
          inverseProject={inverseProject}
          isDark={isDark}
        />
      )}

      {/* Top-right: PH + GitHub + About */}
      <div className="absolute top-4 right-5 z-20 flex items-center gap-2">

        {/* Product Hunt button — icon-only on mobile, full label on desktop */}
        <a
          href="https://www.producthunt.com/products/zonemap"
          target="_blank"
          rel="noopener noreferrer"
          title="Product Hunt"
          className="
            w-8 h-8 md:w-auto md:h-10 md:px-3.5 md:gap-2 flex items-center justify-center
            rounded-xl border border-border bg-bg-primary/85 backdrop-blur-sm shadow-sm
            text-text-secondary hover:text-[#ff6154]
            transition-colors duration-150
          "
        >
          <svg width="15" height="15" className="md:hidden" viewBox="0 0 40 40" fill="currentColor">
            <path d="M22.667 20H17.333V13.333H22.667C24.507 13.333 26 14.827 26 16.667C26 18.507 24.507 20 22.667 20Z" />
            <path d="M20 0C8.953 0 0 8.953 0 20C0 31.047 8.953 40 20 40C31.047 40 40 31.047 40 20C40 8.953 31.047 0 20 0ZM22.667 24H17.333V30H13.333V10H22.667C26.713 10 30 13.287 30 16.667C30 20.047 26.713 23.333 22.667 24Z" />
          </svg>
          <svg width="16" height="16" className="hidden md:block flex-shrink-0" viewBox="0 0 40 40" fill="currentColor">
            <path d="M22.667 20H17.333V13.333H22.667C24.507 13.333 26 14.827 26 16.667C26 18.507 24.507 20 22.667 20Z" />
            <path d="M20 0C8.953 0 0 8.953 0 20C0 31.047 8.953 40 20 40C31.047 40 40 31.047 40 20C40 8.953 31.047 0 20 0ZM22.667 24H17.333V30H13.333V10H22.667C26.713 10 30 13.287 30 16.667C30 20.047 26.713 23.333 22.667 24Z" />
          </svg>
          <span className="hidden md:inline text-[13px] font-semibold whitespace-nowrap">Product Hunt</span>
        </a>

        {/* GitHub link — icon-only on mobile, full label on desktop */}
        <a
          href="https://github.com/zzjoey/ZoneMap"
          target="_blank"
          rel="noopener noreferrer"
          title="View on GitHub"
          className="
            w-8 h-8 md:w-auto md:h-10 md:px-3.5 md:gap-2 flex items-center justify-center
            rounded-xl border border-border bg-bg-primary/85 backdrop-blur-sm shadow-sm
            text-text-secondary hover:text-text-primary hover:bg-text-primary/10
            transition-colors duration-150
          "
        >
          <svg width="15" height="15" className="md:hidden" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          <svg width="16" height="16" className="hidden md:block flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          <span className="hidden md:inline text-[13px] font-semibold whitespace-nowrap">GitHub</span>
        </a>

        {/* About button */}
        <button
          onClick={() => setShowAbout(true)}
          title="About ZoneMap"
          className="
            w-8 h-8 md:w-10 md:h-10 flex items-center justify-center
            rounded-xl border border-border bg-bg-primary/85 backdrop-blur-sm shadow-sm
            text-text-secondary hover:text-text-primary hover:bg-text-primary/10
            transition-colors duration-150 cursor-pointer
          "
        >
          <svg width="15" height="15" className="md:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <svg width="18" height="18" className="hidden md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      </div>

      {/* About modal */}
      <AnimatePresence>
        {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      </AnimatePresence>

      {/* Product Hunt modal — first visit only */}
      <AnimatePresence>
        {showPH && (
          <ProductHuntModal
            onClose={() => {
              setShowPH(false)
              localStorage.setItem('ph_dismissed', '1')
            }}
          />
        )}
      </AnimatePresence>

      {/* Top-left: zonemap.live brand + 12/24h toggle + theme toggle */}
      <div className="absolute top-4 left-5 z-20 flex items-center gap-3">

        {/* Brand */}
        <div className="flex items-baseline pointer-events-none select-none">
          <span className="text-[15px] md:text-[18px] font-semibold tracking-[0.18em] uppercase text-text-primary">
            zonemap
          </span>
          <span className="text-[13px] md:text-[15px] font-semibold tracking-wide text-accent-green">
            .live
          </span>
        </div>

        {/* 24h / 12h / analog format toggle — three-way pill on desktop */}
        <div className="hidden md:flex rounded-xl overflow-hidden border border-border bg-bg-primary/85 backdrop-blur-sm shadow-sm">
          <button
            onClick={() => { onSetAnalog(false); onSetFormat(false) }}
            className={`
              px-4 py-2 text-sm font-semibold tracking-wide
              transition-colors duration-150 cursor-pointer
              ${!useAnalog && !use12h ? 'bg-accent-green text-bg-primary' : 'text-text-muted hover:text-text-primary hover:bg-text-primary/10'}
            `}
          >
            24h
          </button>
          <button
            onClick={() => { onSetAnalog(false); onSetFormat(true) }}
            className={`
              px-4 py-2 text-sm font-semibold tracking-wide
              transition-colors duration-150 cursor-pointer
              ${!useAnalog && use12h ? 'bg-accent-green text-bg-primary' : 'text-text-muted hover:text-text-primary hover:bg-text-primary/10'}
            `}
          >
            12h
          </button>
          <button
            onClick={() => onSetAnalog(true)}
            title="Analog clock"
            className={`
              px-3.5 py-2 flex items-center justify-center
              transition-colors duration-150 cursor-pointer
              ${useAnalog ? 'bg-accent-green text-bg-primary' : 'text-text-muted hover:text-text-primary hover:bg-text-primary/10'}
            `}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="12" x2="12" y2="7" />
              <line x1="12" y1="12" x2="16" y2="14" />
            </svg>
          </button>
        </div>

        {/* Format toggle — compact dropdown on mobile */}
        <div className="md:hidden relative" ref={formatDropdownRef}>
          <button
            onClick={() => setFormatDropdownOpen((v) => !v)}
            title="Time format"
            className="
              w-8 h-8 flex items-center justify-center
              rounded-xl border border-border bg-bg-primary/85 backdrop-blur-sm shadow-sm
              text-text-secondary hover:text-text-primary hover:bg-text-primary/10
              transition-colors duration-150 cursor-pointer
            "
          >
            {useAnalog ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="12" x2="12" y2="7" />
                <line x1="12" y1="12" x2="16" y2="14" />
              </svg>
            ) : (
              <span className="text-[11px] font-bold leading-none">{use12h ? '12h' : '24h'}</span>
            )}
          </button>

          {formatDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 rounded-xl border border-border bg-bg-primary/95 backdrop-blur-sm shadow-lg overflow-hidden z-30 min-w-[72px]">
              <button
                onClick={() => { onSetAnalog(false); onSetFormat(false); setFormatDropdownOpen(false) }}
                className={`
                  w-full px-4 py-2.5 text-xs font-semibold text-left
                  transition-colors duration-150 cursor-pointer
                  ${!useAnalog && !use12h ? 'bg-accent-green text-bg-primary' : 'text-text-secondary hover:text-text-primary hover:bg-text-primary/10'}
                `}
              >
                24h
              </button>
              <button
                onClick={() => { onSetAnalog(false); onSetFormat(true); setFormatDropdownOpen(false) }}
                className={`
                  w-full px-4 py-2.5 text-xs font-semibold text-left
                  transition-colors duration-150 cursor-pointer
                  ${!useAnalog && use12h ? 'bg-accent-green text-bg-primary' : 'text-text-secondary hover:text-text-primary hover:bg-text-primary/10'}
                `}
              >
                12h
              </button>
              <button
                onClick={() => { onSetAnalog(true); setFormatDropdownOpen(false) }}
                className={`
                  w-full px-4 py-2.5 text-xs font-semibold text-left flex items-center gap-2
                  transition-colors duration-150 cursor-pointer
                  ${useAnalog ? 'bg-accent-green text-bg-primary' : 'text-text-secondary hover:text-text-primary hover:bg-text-primary/10'}
                `}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="12" x2="12" y2="7" />
                  <line x1="12" y1="12" x2="16" y2="14" />
                </svg>
                Clock
              </button>
            </div>
          )}
        </div>

        {/* Theme toggle — three-way pill on desktop (Light | Dark | System) */}
        <div className="hidden md:flex rounded-xl overflow-hidden border border-border bg-bg-primary/85 backdrop-blur-sm shadow-sm">
          <button
            onClick={() => onSetTheme('light')}
            title="Light mode"
            className={`
              px-3.5 py-2 flex items-center justify-center
              transition-colors duration-150 cursor-pointer
              ${themeMode === 'light' ? 'bg-accent-green text-bg-primary' : 'text-text-muted hover:text-text-primary hover:bg-text-primary/10'}
            `}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
              <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
              <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
              <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
            </svg>
          </button>
          <button
            onClick={() => onSetTheme('dark')}
            title="Dark mode"
            className={`
              px-3.5 py-2 flex items-center justify-center
              transition-colors duration-150 cursor-pointer
              ${themeMode === 'dark' ? 'bg-accent-green text-bg-primary' : 'text-text-muted hover:text-text-primary hover:bg-text-primary/10'}
            `}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
          <button
            onClick={() => onSetTheme('system')}
            title="System preference"
            className={`
              px-3.5 py-2 flex items-center justify-center
              transition-colors duration-150 cursor-pointer
              ${themeMode === 'system' ? 'bg-accent-green text-bg-primary' : 'text-text-muted hover:text-text-primary hover:bg-text-primary/10'}
            `}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </button>
        </div>

        {/* Theme toggle — compact dropdown on mobile */}
        <div className="md:hidden relative" ref={themeDropdownRef}>
          <button
            onClick={() => setThemeDropdownOpen((v) => !v)}
            title="Theme"
            className="
              w-8 h-8 flex items-center justify-center
              rounded-xl border border-border bg-bg-primary/85 backdrop-blur-sm shadow-sm
              text-text-secondary hover:text-text-primary hover:bg-text-primary/10
              transition-colors duration-150 cursor-pointer
            "
          >
            {themeMode === 'dark' ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : themeMode === 'light' ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
                <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
                <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            )}
          </button>

          {themeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 rounded-xl border border-border bg-bg-primary/95 backdrop-blur-sm shadow-lg overflow-hidden z-30 min-w-[88px]">
              <button
                onClick={() => { onSetTheme('light'); setThemeDropdownOpen(false) }}
                className={`
                  w-full px-4 py-2.5 text-xs font-semibold text-left flex items-center gap-2
                  transition-colors duration-150 cursor-pointer
                  ${themeMode === 'light' ? 'bg-accent-green text-bg-primary' : 'text-text-secondary hover:text-text-primary hover:bg-text-primary/10'}
                `}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
                  <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                  <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
                  <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
                </svg>
                Light
              </button>
              <button
                onClick={() => { onSetTheme('dark'); setThemeDropdownOpen(false) }}
                className={`
                  w-full px-4 py-2.5 text-xs font-semibold text-left flex items-center gap-2
                  transition-colors duration-150 cursor-pointer
                  ${themeMode === 'dark' ? 'bg-accent-green text-bg-primary' : 'text-text-secondary hover:text-text-primary hover:bg-text-primary/10'}
                `}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                Dark
              </button>
              <button
                onClick={() => { onSetTheme('system'); setThemeDropdownOpen(false) }}
                className={`
                  w-full px-4 py-2.5 text-xs font-semibold text-left flex items-center gap-2
                  transition-colors duration-150 cursor-pointer
                  ${themeMode === 'system' ? 'bg-accent-green text-bg-primary' : 'text-text-secondary hover:text-text-primary hover:bg-text-primary/10'}
                `}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                System
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
