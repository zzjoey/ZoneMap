import { useState, useRef, useCallback, useEffect } from 'react'
import { City } from '../../types'

interface TimeSliderProps {
  baseTime: Date
  baseCity: City
  isLive: boolean
  isDark: boolean
  /** Called with offset in minutes from now (positive = future, may exceed 24 h). */
  onChange: (offsetMinutes: number) => void
}

const RANGE     = 144 * 60   // ±144 h in minutes (= 8640)
const PX_PER_HR = 48         // pixels per hour — shows ~±5 h on a 500 px slider

type TickType = 'day' | 'halfday' | 'sixhour' | 'hour'

// Static — built once at module load, never changes
const TICKS: { min: number; type: TickType }[] = []
for (let m = -RANGE; m <= RANGE; m += 60) {
  TICKS.push({
    min: m,
    type: m % 1440 === 0 ? 'day' : m % 720 === 0 ? 'halfday' : m % 360 === 0 ? 'sixhour' : 'hour',
  })
}

/**
 * Format an offset (minutes) as a human-readable string.
 * Handles days, hours, and minutes automatically.
 */
function formatOffset(minutes: number): string {
  if (minutes === 0) return 'now'
  const sign = minutes > 0 ? '+' : '-'
  const abs  = Math.abs(minutes)
  const d    = Math.floor(abs / 1440)
  const h    = Math.floor((abs % 1440) / 60)
  const m    = abs % 60
  if (d > 0 && h > 0) return `${sign}${d}d ${h}h`
  if (d > 0)           return `${sign}${d}d`
  if (h > 0 && m > 0)  return `${sign}${h}h ${m}m`
  if (h > 0)           return `${sign}${h}h`
  return `${sign}${m}m`
}

/**
 * Scrollable offset timeline ruler.
 *
 * Drag left → future, drag right → past.
 * A fixed centre needle shows the current offset; ticks and labels
 * scroll beneath it.  Edges fade into the bar background.
 *
 * onChange receives the offset in minutes from the real wall clock,
 * so multi-day values (+25 h, -48 h …) are passed correctly.
 */
export function TimeSlider({ baseTime, isLive, isDark, onChange }: TimeSliderProps) {
  // Derive offset from actual Date arithmetic — no modulo / day-wrapping issues
  const derivedOffset = Math.round(
    (baseTime.getTime() - Date.now()) / 60_000
  )
  const clampedDerived = Math.max(-RANGE, Math.min(RANGE, derivedOffset))

  const [displayOffset, setDisplayOffset] = useState(isLive ? 0 : clampedDerived)

  const isDragging    = useRef(false)
  const pointerStartX = useRef(0)
  const offsetAtStart = useRef(0)

  // Sync from external changes (text-input, live toggle, URL restore)
  useEffect(() => {
    if (!isDragging.current) {
      setDisplayOffset(isLive ? 0 : clampedDerived)
    }
  }, [clampedDerived, isLive])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current    = true
    pointerStartX.current = e.clientX
    offsetAtStart.current = displayOffset
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [displayOffset])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const pxPerMin  = PX_PER_HR / 60
    const deltaX    = e.clientX - pointerStartX.current
    const newOffset = offsetAtStart.current - deltaX / pxPerMin
    const clamped   = Math.max(-RANGE, Math.min(RANGE, newOffset))
    setDisplayOffset(clamped)
    onChange(Math.round(clamped))
  }, [onChange])

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    setDisplayOffset(prev => Math.max(-RANGE, Math.min(RANGE, Math.round(prev))))
  }, [])

  const pxPerMin      = PX_PER_HR / 60
  const roundedOffset = Math.round(displayOffset)
  const showLabel     = !isLive && roundedOffset !== 0

  return (
    <div
      className="flex-1 relative overflow-hidden cursor-ew-resize select-none touch-none mx-3"
      style={{ height: '50px' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >

      {/* ── Moving ruler tape ─────────────────────────────────────────────── */}
      <div
        className="absolute inset-y-0 pointer-events-none"
        style={{
          left: '50%',
          transform: `translateX(${-(displayOffset * pxPerMin)}px)`,
          willChange: 'transform',
        }}
      >
        {TICKS.map(({ min, type }) => {
          const isNow = min === 0
          const days  = Math.abs(min) / 1440
          const label = isNow
            ? 'now'
            : min > 0
            ? `+${days}d`
            : `-${days}d`

          return (
            <div
              key={min}
              className="absolute top-0 bottom-0 flex flex-col items-center"
              style={{ left: `${min * pxPerMin}px`, transform: 'translateX(-50%)' }}
            >
              {/* gap — keeps ticks below the floating offset-label zone */}
              <div style={{ height: '15px', flexShrink: 0 }} />

              {/* Tick line */}
              <div className={`w-px rounded-full flex-shrink-0 ${
                isNow
                  ? 'h-[11px] bg-accent-green/65'
                  : type === 'day'
                  ? 'h-[11px] bg-text-primary/35'
                  : type === 'halfday'
                  ? 'h-[8px] bg-text-primary/25'
                  : type === 'sixhour'
                  ? 'h-[6px] bg-text-primary/20'
                  : 'h-[4px] bg-text-primary/20'
              }`} />

              {/* Label — day boundaries only */}
              {(type === 'day') && (
                <div className={`mt-[3px] text-center whitespace-nowrap leading-none tabular-nums flex-shrink-0 ${
                  isNow
                    ? 'text-[9px] font-semibold text-accent-green/70'
                    : 'text-[8px] text-text-muted/50'
                }`}>
                  {label}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Fixed centre needle ───────────────────────────────────────────── */}
      <div
        className="absolute inset-y-0 w-px pointer-events-none z-10"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          background: `linear-gradient(to bottom,
            rgb(var(--accent-green) / 0)    0%,
            rgb(var(--accent-green) / 0.5) 20%,
            rgb(var(--accent-green) / 0.5) 82%,
            rgb(var(--accent-green) / 0)  100%)`,
        }}
      />

      {/* ── Edge-fade gradient ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: `linear-gradient(to right,
            rgb(var(--bg-secondary))    0%,
            rgb(var(--bg-secondary)/0) 22%,
            rgb(var(--bg-secondary)/0) 78%,
            rgb(var(--bg-secondary))  100%)`,
        }}
      />

      {/* ── Offset label pill — fixed at centre, above the ticks ────────── */}
      <div
        className="absolute pointer-events-none z-30 flex justify-center"
        style={{ top: '1px', left: '50%', transform: 'translateX(-50%)' }}
      >
        <div className={`
          flex items-center px-2 py-px rounded-full
          transition-all duration-150
          ${showLabel
            ? isDark
              ? 'opacity-100 bg-amber-500/12 border border-amber-500/30'
              : 'opacity-100 bg-red-500/10 border border-red-500/30'
            : 'opacity-0'
          }
        `}>
          <span className={`text-[11px] font-semibold tabular-nums whitespace-nowrap leading-tight ${
            isDark ? 'text-amber-400' : 'text-red-600'
          }`}>
            {showLabel ? formatOffset(roundedOffset) : '\u200b'}
          </span>
        </div>
      </div>

    </div>
  )
}
