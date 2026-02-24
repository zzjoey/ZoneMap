import { motion } from 'framer-motion'
import { City } from '../../types'
import { getLocalHourDecimal, formatCityTime } from '../../utils/timeUtils'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'

interface WorkingHoursBarProps {
  cities: City[]
  baseTime: Date
  workStart?: number // default 9 (9am)
  workEnd?: number   // default 18 (6pm)
}

// Hour labels shown on the axis
const AXIS_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24]

function formatHourLabel(h: number): string {
  if (h === 0 || h === 24) return '12a'
  if (h === 12) return '12p'
  return h < 12 ? `${h}a` : `${h - 12}p`
}

/**
 * 24-hour working hours timeline.
 * Shows each city as a horizontal bar with:
 *   - The 9am–6pm work block highlighted
 *   - A vertical "now" indicator at the city's current local hour
 */
export function WorkingHoursBar({ cities, baseTime, workStart = 9, workEnd = 18 }: WorkingHoursBarProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="flex-shrink-0 bg-bg-secondary border-t border-border">
      {/* Header toggle */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-text-primary/5 transition-colors"
      >
        <span className="text-[10px] font-light tracking-widest uppercase text-text-muted">
          Working Hours Overlap
        </span>
        <motion.svg
          animate={{ rotate: isExpanded ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-text-muted"
        >
          <polyline points="2,7 5,4 8,7" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              {/* Hour axis */}
              <div className="relative flex mb-1.5 ml-20">
                {AXIS_HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute text-[8px] text-text-muted font-light -translate-x-1/2"
                    style={{ left: `${(h / 24) * 100}%` }}
                  >
                    {formatHourLabel(h)}
                  </div>
                ))}
              </div>

              {/* City rows */}
              <div className="space-y-1.5 mt-3">
                {cities.map((city) => (
                  <CityTimelineRow
                    key={city.id}
                    city={city}
                    baseTime={baseTime}
                    workStart={workStart}
                    workEnd={workEnd}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface CityTimelineRowProps {
  city: City
  baseTime: Date
  workStart: number
  workEnd: number
}

function CityTimelineRow({ city, baseTime, workStart, workEnd }: CityTimelineRowProps) {
  const localHour = getLocalHourDecimal(baseTime, city.timezone)
  const localTime = formatCityTime(baseTime, city.timezone)

  // Positions as percentages of the 24-hour bar
  const nowPct = (localHour / 24) * 100
  const workStartPct = (workStart / 24) * 100
  const workWidthPct = ((workEnd - workStart) / 24) * 100

  const isWorking = localHour >= workStart && localHour < workEnd

  return (
    <div className="flex items-center gap-2">
      {/* City label */}
      <div className="w-20 flex-shrink-0">
        <span className="text-[10px] font-light text-text-secondary truncate block">
          {city.name}
        </span>
      </div>

      {/* Timeline bar */}
      <div className="flex-1 relative h-5 bg-bg-primary rounded-full overflow-hidden">
        {/* Work-hours highlight */}
        <div
          className={`absolute h-full rounded-full transition-colors duration-300 ${
            isWorking ? 'bg-accent-green-dim' : 'bg-text-primary/5'
          }`}
          style={{ left: `${workStartPct}%`, width: `${workWidthPct}%` }}
        />

        {/* Work-start edge line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-text-primary/10"
          style={{ left: `${workStartPct}%` }}
        />

        {/* Work-end edge line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-text-primary/10"
          style={{ left: `${workStartPct + workWidthPct}%` }}
        />

        {/* "Now" needle */}
        <motion.div
          className={`absolute top-0 bottom-0 w-0.5 rounded-full ${
            isWorking ? 'bg-accent-green' : 'bg-text-muted'
          }`}
          style={{ left: `${nowPct}%` }}
          layout
          transition={{ type: 'tween', duration: 0.4 }}
        />

        {/* "Now" dot at needle top */}
        <motion.div
          className={`absolute top-0.5 w-1.5 h-1.5 rounded-full -translate-x-1/2 ${
            isWorking ? 'bg-accent-green' : 'bg-text-muted'
          }`}
          style={{ left: `${nowPct}%` }}
          layout
          transition={{ type: 'tween', duration: 0.4 }}
        />
      </div>

      {/* Current local time */}
      <div
        className={`w-10 flex-shrink-0 text-right text-[10px] tabular-nums font-light ${
          isWorking ? 'text-accent-green' : 'text-text-muted'
        }`}
      >
        {localTime}
      </div>
    </div>
  )
}
