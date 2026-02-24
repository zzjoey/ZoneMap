import { AnimatePresence, motion } from 'framer-motion'
import { City, ProjectFn } from '../../types'
import { formatCityTimeStr } from '../../utils/timeUtils'

interface CityMarkersProps {
  cities: City[]
  baseTime: Date
  activeCity: City
  project: ProjectFn
  use12h: boolean
  onCityClick: (city: City) => void
}

// ---------------------------------------------------------------------------
// Label placement — greedy overlap avoidance
// ---------------------------------------------------------------------------
const LABEL_H = 34

type Box = { x: number; y: number; w: number; h: number }

/** True when two boxes overlap (with optional padding on all sides). */
function boxesOverlap(a: Box, b: Box, pad = 2): boolean {
  return !(
    a.x + a.w + pad < b.x ||
    b.x + b.w + pad < a.x ||
    a.y + a.h + pad < b.y ||
    b.y + b.h + pad < a.y
  )
}

/** Bounding box of a label given dot centre and offsets (matches <rect> in TimeLabel). */
function labelBox(cx: number, cy: number, ox: number, oy: number, w: number): Box {
  return { x: cx + ox - 4, y: cy + oy - 15, w, h: LABEL_H }
}

interface PlacedInfo {
  id: string
  x: number
  y: number
  isActive: boolean
  labelW: number
}

/**
 * Greedy label placement.
 * Active city gets first pick; remaining cities are sorted left-to-right.
 * For each city we try 8 candidate positions and pick the one with the fewest
 * overlaps against already-placed labels and other cities' dot glow rings.
 */
function computeLabelOffsets(cities: PlacedInfo[]): Map<string, [number, number]> {
  const result = new Map<string, [number, number]>()
  const occupiedBoxes: Box[] = []

  // Dot bounding boxes (used to avoid OTHER cities' dots when placing labels)
  const dotBoxMap = new Map<string, Box>(
    cities.map(({ id, x, y, isActive }) => {
      const r = isActive ? 14 : 11
      return [id, { x: x - r, y: y - r, w: r * 2, h: r * 2 }]
    })
  )

  // Active city first so it keeps the default right-side position
  const sorted = [...cities].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
    return a.x - b.x
  })

  for (const city of sorted) {
    const { id, x, y, labelW } = city
    const rOx = 12            // right offset
    const lOx = -(labelW + 5) // left offset

    const candidates: Array<[number, number]> = [
      [rOx, -9],   // right-centre (default)
      [lOx, -9],   // left-centre
      [rOx, -34],  // right-up
      [lOx, -34],  // left-up
      [rOx, 20],   // right-down
      [lOx, 20],   // left-down
      [rOx, -58],  // right-high
      [lOx, -58],  // left-high
    ]

    // Collect other cities' dot boxes as obstacles
    const otherDots = [...dotBoxMap.entries()]
      .filter(([dotId]) => dotId !== id)
      .map(([, box]) => box)

    let bestOx = rOx
    let bestOy = -9
    let minScore = Infinity

    for (const [ox, oy] of candidates) {
      const box = labelBox(x, y, ox, oy, labelW)
      const score = [...occupiedBoxes, ...otherDots].filter((b) =>
        boxesOverlap(box, b)
      ).length

      if (score < minScore) {
        minScore = score
        bestOx = ox
        bestOy = oy
      }
      if (minScore === 0) break
    }

    result.set(id, [bestOx, bestOy])
    occupiedBoxes.push(labelBox(x, y, bestOx, bestOy, labelW))
  }

  return result
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export function CityMarkers({ cities, baseTime, activeCity, project, use12h, onCityClick }: CityMarkersProps) {
  // 12h labels are wider ("2:30 AM" vs "14:30")
  const labelW = (isActive: boolean) => use12h
    ? (isActive ? 132 : 122)
    : (isActive ? 114 : 104)

  // Project all cities to screen coordinates
  const positioned = cities.flatMap((city) => {
    const pos = project([city.lng, city.lat])
    if (!pos) return []
    const [x, y] = pos
    const isActive = city.id === activeCity.id
    return [{ id: city.id, x, y, isActive, labelW: labelW(isActive), city }]
  })

  // Compute collision-free label offsets
  const labelOffsets = computeLabelOffsets(positioned)

  return (
    <g>
      <AnimatePresence>
        {positioned.map(({ city, x, y, isActive, labelW: lw }) => {
          const localTime = formatCityTimeStr(baseTime, city.timezone, use12h)
          const [ox, oy] = labelOffsets.get(city.id) ?? [12, -9]
          return (
            <CityMarker
              key={city.id}
              city={city}
              x={x}
              y={y}
              localTime={localTime}
              isActive={isActive}
              labelOx={ox}
              labelOy={oy}
              labelW={lw}
              onClick={() => onCityClick(city)}
            />
          )
        })}
      </AnimatePresence>
    </g>
  )
}

interface CityMarkerProps {
  city: City
  x: number
  y: number
  localTime: string
  isActive: boolean
  labelOx: number
  labelOy: number
  labelW: number
  onClick: () => void
}

function CityMarker({ city, x, y, localTime, isActive, labelOx, labelOy, labelW, onClick }: CityMarkerProps) {
  const dotRadius = isActive ? 6 : 4.5
  const dotColor = isActive ? '#4ade80' : '#60a5fa'
  const ringColor = isActive ? 'rgba(74,222,128,0.25)' : 'rgba(96,165,250,0.2)'

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
      onClick={onClick}
      className="cursor-pointer"
    >
      {/* Glow ring */}
      <circle cx={x} cy={y} r={dotRadius + 7} fill={ringColor} />

      {/* Main dot */}
      <circle
        cx={x}
        cy={y}
        r={dotRadius}
        fill={dotColor}
        stroke={isActive ? 'rgba(74,222,128,0.8)' : 'rgba(96,165,250,0.5)'}
        strokeWidth={1.5}
      />

      {/* Active pulsing ring */}
      {isActive && (
        <motion.g
          style={{ transformOrigin: `${x}px ${y}px` }}
          animate={{ scale: [1, 3.5], opacity: [0.7, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
        >
          <circle cx={x} cy={y} r={dotRadius} fill="none" stroke="#4ade80" strokeWidth={1.5} />
        </motion.g>
      )}

      {/* Label */}
      <TimeLabel
        x={x}
        y={y}
        cityName={city.name}
        localTime={localTime}
        isActive={isActive}
        offsetX={labelOx}
        offsetY={labelOy}
        rectW={labelW}
      />
    </motion.g>
  )
}

interface TimeLabelProps {
  x: number
  y: number
  cityName: string
  localTime: string
  isActive: boolean
  offsetX: number
  offsetY: number
  rectW: number
}

function TimeLabel({ x, y, cityName, localTime, isActive, offsetX, offsetY, rectW }: TimeLabelProps) {
  const labelX = x + offsetX
  const labelY = y + offsetY

  return (
    <g>
      <rect
        x={labelX - 4}
        y={labelY - 15}
        width={rectW}
        height={34}
        rx={5}
        fill="rgba(5,8,13,0.90)"
        stroke={isActive ? 'rgba(74,222,128,0.42)' : 'rgba(255,255,255,0.08)'}
        strokeWidth={0.8}
      />
      <text
        x={labelX}
        y={labelY - 2}
        fill={isActive ? '#4ade80' : '#94a3b8'}
        fontSize={11}
        fontFamily="Inter, system-ui"
        fontWeight="400"
        letterSpacing="0.6"
      >
        {cityName.toUpperCase()}
      </text>
      <text
        x={labelX}
        y={labelY + 13}
        fill={isActive ? '#e2faea' : '#f8fafc'}
        fontSize={14}
        fontFamily="Inter, system-ui"
        fontWeight="200"
        letterSpacing="0.4"
      >
        {localTime}
      </text>
    </g>
  )
}
