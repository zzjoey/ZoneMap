import { useEffect, useRef, useState, useCallback } from 'react'
import { Reorder, useDragControls, motion } from 'framer-motion'
import { City } from '../../types'
import { CityCard } from './CityCard'
import { AddCityButton } from './AddCityButton'

interface CityCardRowProps {
  cities: City[]
  baseCity: City
  baseTime: Date
  use12h: boolean
  useAnalog: boolean
  isDark: boolean
  onSelectBase: (city: City) => void
  onRemove: (cityId: string) => void
  onAddCity: () => void
  onReorder: (cities: City[]) => void
}

const MIN_WIDTH = 300    // narrowest usable card panel
const MAX_WIDTH = 560
const DEFAULT_WIDTH = 384
const MIN_MAP_WIDTH = 320 // map always gets at least this much space
const MAX_CITIES = 6

function clampPanelWidth(w: number): number {
  const maxAllowed = typeof window !== 'undefined'
    ? Math.max(MIN_WIDTH, window.innerWidth - MIN_MAP_WIDTH)
    : MAX_WIDTH
  return Math.min(Math.min(MAX_WIDTH, maxAllowed), Math.max(MIN_WIDTH, w))
}

interface MobileDraggableItemProps {
  city: City
  baseCity: City
  baseTime: Date
  use12h: boolean
  useAnalog: boolean
  isDark: boolean
  isDesktop: boolean
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  onSelectBase: (city: City) => void
  onRemove: (cityId: string) => void
}

function MobileDraggableItem({
  city,
  baseCity,
  baseTime,
  use12h,
  useAnalog,
  isDark,
  isDesktop,
  scrollContainerRef,
  onSelectBase,
  onRemove,
}: MobileDraggableItemProps) {
  const dragControls = useDragControls()
  const [isDragReady, setIsDragReady] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startYRef = useRef(0)
  const savedEventRef = useRef<PointerEvent | null>(null)
  const latestEventRef = useRef<PointerEvent | null>(null)
  const isDragActiveRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const scrollSpeedRef = useRef(0)

  const cancelTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    scrollSpeedRef.current = 0
    isDragActiveRef.current = false
    setIsDragReady(false)
  }, [])

  // Cleanup on unmount: cancel timer and any running animation frame
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isDesktop) return
    // Clear any existing timer before starting a new one (handles 2-finger touch)
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      setIsDragReady(false)
    }
    startYRef.current = e.clientY
    savedEventRef.current = e.nativeEvent
    latestEventRef.current = e.nativeEvent
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      isDragActiveRef.current = true
      setIsDragReady(true)
      navigator.vibrate?.(50)
      const ev = latestEventRef.current ?? savedEventRef.current
      if (ev) dragControls.start(ev)
    }, 400)
  }, [isDesktop, dragControls, cancelTimer])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isDesktop) return
    latestEventRef.current = e.nativeEvent

    // Cancel long-press timer if finger moved too much (user is scrolling)
    if (timerRef.current !== null) {
      if (Math.abs(e.clientY - startYRef.current) > 8) cancelTimer()
      return
    }

    // Auto-scroll when dragging near top/bottom edges of the card list
    if (!isDragActiveRef.current || !scrollContainerRef.current) return
    const rect = scrollContainerRef.current.getBoundingClientRect()
    const EDGE = 60
    const MAX_SPEED = 10
    let speed = 0
    if (e.clientY < rect.top + EDGE) {
      speed = -MAX_SPEED * (1 - Math.max(0, e.clientY - rect.top) / EDGE)
    } else if (e.clientY > rect.bottom - EDGE) {
      speed = MAX_SPEED * (1 - Math.max(0, rect.bottom - e.clientY) / EDGE)
    }
    scrollSpeedRef.current = speed

    if (speed !== 0 && rafRef.current === null) {
      const loop = () => {
        if (scrollContainerRef.current && scrollSpeedRef.current !== 0) {
          scrollContainerRef.current.scrollTop += scrollSpeedRef.current
          // Re-sync FM's drag tracking: the container scrolled but the pointer didn't move,
          // so FM needs a synthetic pointermove to recompute the drag offset.
          const ev = latestEventRef.current
          if (ev) {
            window.dispatchEvent(new PointerEvent('pointermove', {
              pointerId: ev.pointerId,
              clientX: ev.clientX,
              clientY: ev.clientY,
              screenX: ev.screenX,
              screenY: ev.screenY,
              bubbles: true,
              cancelable: true,
              isPrimary: ev.isPrimary,
            }))
          }
          rafRef.current = requestAnimationFrame(loop)
        } else {
          rafRef.current = null
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    } else if (speed === 0 && rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [isDesktop, cancelTimer, scrollContainerRef])

  return (
    <Reorder.Item
      value={city}
      dragControls={dragControls}
      dragListener={isDesktop}
      layout="position"
      className="flex-shrink-0"
      style={{ cursor: isDesktop ? 'grab' : 'default' }}
      whileDrag={{ zIndex: 10 }}
      transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelTimer}
      onPointerCancel={cancelTimer}
      onDragEnd={cancelTimer}
    >
      {/* Scale animation on inner wrapper so it doesn't conflict with Reorder.Item's layout animation */}
      <motion.div
        animate={{ scale: isDragReady ? 1.04 : 1, boxShadow: isDragReady ? '0 8px 32px rgba(0,0,0,0.4)' : '0 0 0 rgba(0,0,0,0)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <CityCard
          city={city}
          baseCity={baseCity}
          baseTime={baseTime}
          use12h={use12h}
          useAnalog={useAnalog}
          isDark={isDark}
          isActive={city.id === baseCity.id}
          isDragging={isDragReady}
          onSelect={onSelectBase}
          onRemove={onRemove}
        />
      </motion.div>
    </Reorder.Item>
  )
}

/**
 * City card panel.
 * Mobile:  absolute overlay at the bottom of the map (frosted glass, vertical cards).
 * Desktop: resizable left sidebar with drag-to-reorder.
 */
export function CityCardRow({
  cities,
  baseCity,
  baseTime,
  use12h,
  useAnalog,
  isDark,
  onSelectBase,
  onRemove,
  onAddCity,
  onReorder,
}: CityCardRowProps) {
  const [panelWidth, setPanelWidth] = useState(() => clampPanelWidth(DEFAULT_WIDTH))
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  )
  const resizeStartX = useRef(0)
  const resizeStartW = useRef(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Keep panel width in bounds when window is resized
  useEffect(() => {
    const handler = () => {
      setIsDesktop(window.innerWidth >= 768)
      setPanelWidth((prev) => clampPanelWidth(prev))
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  function handleResizeMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    resizeStartX.current = e.clientX
    resizeStartW.current = panelWidth

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - resizeStartX.current
      setPanelWidth(clampPanelWidth(resizeStartW.current + delta))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const atMax = cities.length >= MAX_CITIES

  return (
    <div
      className="
        relative flex-1 min-h-0 overflow-hidden
        bg-bg-primary border-t border-border
        md:flex-none md:flex-shrink-0 md:border-t-0 md:border-r
      "
      style={isDesktop ? { width: panelWidth } : undefined}
    >
      {/* Card list — motion.div with layoutScroll so FM accounts for scroll offset in layout animations */}
      <motion.div
        layoutScroll
        ref={scrollContainerRef}
        className="
          flex flex-col gap-2 px-3 pt-2.5 pb-3 h-full overflow-y-auto
          md:gap-3 md:px-3 md:py-3 md:max-h-none md:overflow-x-hidden
        "
      >
        <Reorder.Group
          as="div"
          axis="y"
          values={cities}
          onReorder={onReorder}
          className="flex flex-col gap-2 md:gap-3"
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {cities.map((city) => (
            <MobileDraggableItem
              key={city.id}
              city={city}
              baseCity={baseCity}
              baseTime={baseTime}
              use12h={use12h}
              useAnalog={useAnalog}
              isDark={isDark}
              isDesktop={isDesktop}
              scrollContainerRef={scrollContainerRef}
              onSelectBase={onSelectBase}
              onRemove={onRemove}
            />
          ))}
        </Reorder.Group>

        {!atMax && <AddCityButton onClick={onAddCity} />}
      </motion.div>

      {/* Resize handle — desktop only */}
      <div
        className="
          hidden md:block absolute right-0 top-0 bottom-0 w-1
          cursor-col-resize hover:bg-accent-green/25 transition-colors duration-150
        "
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  )
}
