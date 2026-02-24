import { motion } from 'framer-motion'
import { City } from '../../types'
import { TimeInput } from './TimeInput'
import { TimeSlider } from './TimeSlider'
import { parseTimeInTimezone } from '../../utils/timeUtils'

interface TimeControlProps {
  baseCity: City
  baseTime: Date
  isLive: boolean
  use12h: boolean
  isDark: boolean
  onTimeChange: (date: Date) => void
  onResetLive: () => void
}

/**
 * Bottom control bar: city label + time input + offset timeline slider + live toggle.
 */
export function TimeControl({
  baseCity,
  baseTime,
  isLive,
  use12h,
  isDark,
  onTimeChange,
  onResetLive,
}: TimeControlProps) {
  function handleInputChange(timeStr: string) {
    const date = parseTimeInTimezone(timeStr, baseCity.timezone)
    onTimeChange(date)
  }

  function handleSliderChange(offsetMinutes: number) {
    // Apply the full offset (including multi-day) directly to the real wall clock.
    // This avoids the minutes-of-day modulo issue and gives correct dates.
    const targetDate = new Date(Date.now() + offsetMinutes * 60 * 1000)
    onTimeChange(targetDate)
  }

  return (
    <div
      className="flex-shrink-0 flex items-center gap-2 md:gap-4 px-3 md:px-5 bg-bg-secondary border-t border-border"
      style={{ height: '4rem' }}
    >
      {/* Base city label — hidden on small screens to save space */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-accent-green flex-shrink-0" />
        <span className="text-sm font-medium text-text-secondary whitespace-nowrap">
          {baseCity.name}
        </span>
      </div>

      {/* Time text input */}
      <TimeInput
        baseTime={baseTime}
        baseCity={baseCity}
        use12h={use12h}
        onChange={handleInputChange}
      />

      {/* Offset timeline slider */}
      <TimeSlider
        baseTime={baseTime}
        baseCity={baseCity}
        isLive={isLive}
        onChange={handleSliderChange}
      />

      {/* Live / Paused toggle */}
      <motion.button
        onClick={isLive ? undefined : onResetLive}
        whileHover={isLive ? {} : { scale: 1.05 }}
        whileTap={isLive ? {} : { scale: 0.95 }}
        className={`
          flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium
          border transition-colors duration-200
          ${isLive
            ? 'border-accent-green-border text-accent-green bg-accent-green-dim cursor-default'
            : isDark
            ? 'border-amber-500/60 text-amber-400 bg-amber-500/10 cursor-pointer'
            : 'border-orange-500/55 text-orange-600 bg-orange-50 cursor-pointer'
          }
        `}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${
          isLive
            ? 'bg-accent-green animate-pulse-slow'
            : isDark
            ? 'bg-amber-400 animate-pulse'
            : 'bg-orange-500 animate-pulse'
        }`} />
        {isLive ? 'Live' : 'Resume'}
      </motion.button>
    </div>
  )
}
