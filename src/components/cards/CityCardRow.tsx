import { useEffect, useRef, useState } from 'react'
import { Reorder, useDragControls, motion, AnimatePresence } from 'framer-motion'
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

interface DraggableCardItemProps {
  city: City
  baseCity: City
  baseTime: Date
  use12h: boolean
  useAnalog: boolean
  isDark: boolean
  isEditMode: boolean
  isDesktop: boolean
  onSelectBase: (city: City) => void
  onRemove: (cityId: string) => void
}

function DraggableCardItem({
  city, baseCity, baseTime, use12h, useAnalog, isDark,
  isEditMode, isDesktop, onSelectBase, onRemove,
}: DraggableCardItemProps) {
  const dragControls = useDragControls()
  const isActive = city.id === baseCity.id

  return (
    <Reorder.Item
      key={city.id}
      value={city}
      dragListener={isDesktop}
      dragControls={!isDesktop && isEditMode ? dragControls : undefined}
      layout="position"
      className="flex-shrink-0"
      style={{ cursor: isDesktop ? 'grab' : 'default' }}
      whileDrag={{ zIndex: 10 }}
      transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
    >
      <div className="flex items-center gap-0">
        {/* Drag handle — edit mode only, mobile only */}
        <AnimatePresence>
          {isEditMode && !isDesktop && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 32, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="flex-shrink-0 flex items-center justify-center cursor-grab overflow-hidden"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => {
                e.preventDefault()
                dragControls.start(e)
              }}
            >
              <span className="text-text-muted text-base select-none">⠿</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <div className="flex-1 min-w-0">
          <CityCard
            city={city}
            baseCity={baseCity}
            baseTime={baseTime}
            use12h={use12h}
            useAnalog={useAnalog}
            isDark={isDark}
            isActive={isActive}
            onSelect={onSelectBase}
            onRemove={onRemove}
          />
        </div>

        {/* Delete button — edit mode only, mobile only, not for base city */}
        <AnimatePresence>
          {isEditMode && !isDesktop && !isActive && (
            <motion.button
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 32, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={() => onRemove(city.id)}
              className="flex-shrink-0 flex items-center justify-center overflow-hidden"
            >
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs
                              flex items-center justify-center font-bold">−</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
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
  const [isEditMode, setIsEditMode] = useState(false)
  const resizeStartX = useRef(0)
  const resizeStartW = useRef(0)

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
      {/* Card list */}
      <div
        className="
          flex flex-col gap-2 px-3 pt-2.5 pb-3 h-full overflow-y-auto
          md:gap-3 md:px-3 md:py-3 md:max-h-none md:overflow-x-hidden
        "
      >
        {!isDesktop && cities.length > 0 && (
          <div className="flex justify-end mb-1">
            <button
              onClick={() => setIsEditMode((v) => !v)}
              className="text-xs font-medium text-accent-green px-2 py-1 rounded-md
                         active:bg-accent-green/10 transition-colors"
            >
              {isEditMode ? 'Done' : 'Edit'}
            </button>
          </div>
        )}

        <Reorder.Group
          as="div"
          axis="y"
          values={cities}
          onReorder={onReorder}
          className="flex flex-col gap-2 md:gap-3"
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {cities.map((city) => (
            <DraggableCardItem
              key={city.id}
              city={city}
              baseCity={baseCity}
              baseTime={baseTime}
              use12h={use12h}
              useAnalog={useAnalog}
              isDark={isDark}
              isEditMode={isEditMode}
              isDesktop={isDesktop}
              onSelectBase={onSelectBase}
              onRemove={onRemove}
            />
          ))}
        </Reorder.Group>

        {!atMax && <AddCityButton onClick={onAddCity} />}
      </div>

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
