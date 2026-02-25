import { motion, AnimatePresence } from 'framer-motion'
import { City } from '../../types'
import { formatCityTimeParts, formatCityDate, getRelativeOffset } from '../../utils/timeUtils'
import { isCityDaytime } from '../../utils/terminator'
import { useState, useMemo, memo } from 'react'
import { AnalogClock } from './AnalogClock'

interface CityCardProps {
  city: City
  baseCity: City
  baseTime: Date
  use12h: boolean
  useAnalog: boolean
  isDark: boolean
  isActive: boolean
  isDragging?: boolean
  onSelect: (city: City) => void
  onRemove: (cityId: string) => void
}

/**
 * Individual city time card.
 *
 * Desktop: wide card with full info (name, country, date, large time).
 * Mobile:  compact fixed-width card (name + time, no country/date).
 */
export const CityCard = memo(function CityCard({ city, baseCity, baseTime, use12h, useAnalog, isDark, isActive, isDragging, onSelect, onRemove }: CityCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Memoize all timezone-dependent computations so hover state changes don't trigger recomputation
  const { hours, minutes, period, hours24, analogMinutes, localDate, isDifferentDay, offset, isDay } = useMemo(() => {
    const parts = formatCityTimeParts(baseTime, city.timezone, use12h)
    const parts24 = formatCityTimeParts(baseTime, city.timezone, false)
    const date = formatCityDate(baseTime, city.timezone)
    const baseDate = formatCityDate(baseTime, baseCity.timezone)
    return {
      hours: parts.hours,
      minutes: parts.minutes,
      period: parts.period,
      hours24: parts24.hours,
      analogMinutes: parts24.minutes,
      localDate: date,
      isDifferentDay: !isActive && date !== baseDate,
      offset: getRelativeOffset(city.timezone, baseCity.timezone, baseTime),
      isDay: isCityDaytime(baseTime, city.lat, city.lng),
    }
  }, [baseTime, city.timezone, city.lat, city.lng, use12h, baseCity.timezone, isActive])

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    onRemove(city.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      whileHover={{ scale: 1.02 }}
      whileTap={isDragging ? undefined : { scale: 0.98 }}
      onClick={() => onSelect(city)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative w-full
        rounded-card px-3 md:px-4 lg:px-5 py-3 md:py-4 lg:py-5
        cursor-pointer border transition-colors duration-300
        ${isDay ? 'bg-bg-card-day' : 'bg-bg-card-night'}
        ${isActive
          ? 'border-2 border-accent-green-border card-glow'
          : 'border border-border hover:border-text-muted/50'
        }
      `}
    >
      {/* Desktop: hover-based remove button */}
      <AnimatePresence>
        {isHovered && !isActive && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            onClick={handleRemove}
            className="hidden md:flex absolute top-2.5 right-2.5 w-6 h-6 items-center justify-center
                       rounded-full text-text-muted hover:text-text-primary hover:bg-text-primary/10
                       text-base leading-none transition-colors z-10"
          >
            ×
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile: always-visible remove button */}
      {!isActive && (
        <button
          onClick={handleRemove}
          className="md:hidden absolute top-2 right-2 w-5 h-5 flex items-center justify-center
                     rounded-full text-text-muted text-xs bg-bg-primary/80 border border-border/60 z-10"
        >
          ×
        </button>
      )}

      {/* Offset badge */}
      <div className="mb-1.5 md:mb-2.5 lg:mb-4">
        {isActive ? (
          <span className="text-[10px] md:text-xs lg:text-sm font-semibold text-accent-green uppercase tracking-widest flex items-center gap-1">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-accent-green inline-block"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            />
            Base
          </span>
        ) : (
          <span className="text-[10px] md:text-xs lg:text-sm font-semibold px-2 py-0.5 rounded-full text-accent-green bg-accent-green-dim border border-accent-green/20">
            {offset}
          </span>
        )}
      </div>

      {/* Main content: city info + time */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between md:gap-3">
        {/* City name (+ country + date on desktop) */}
        <div className="min-w-0 mb-1 md:mb-0 md:flex-1">
          <div className="text-[13px] md:text-[13px] lg:text-[15px] font-semibold text-text-primary tracking-wide uppercase truncate">
            {city.name}
          </div>
          <div className="text-[11px] md:text-[11px] lg:text-[13px] text-text-secondary truncate mt-0.5">
            {city.country}
          </div>
          {isDifferentDay ? (
            <div className="mt-1">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] md:text-[11px] font-semibold tracking-wide border ${
                isDark
                  ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                  : 'bg-red-500/12 text-red-600 border-red-500/30'
              }`}>
                {localDate}
              </span>
            </div>
          ) : (
            <div className="hidden md:block text-[11px] lg:text-[13px] text-text-muted truncate mt-0.5">
              {localDate}
            </div>
          )}
        </div>

        {/* Time — analog clock or digital digits */}
        {useAnalog ? (
          <div className="flex-shrink-0 flex items-center">
            <AnalogClock hours={parseInt(hours24)} minutes={parseInt(analogMinutes)} size={64} className="md:hidden" />
            <AnalogClock hours={parseInt(hours24)} minutes={parseInt(analogMinutes)} size={84} className="hidden md:block" />
          </div>
        ) : (
          <div className="flex-shrink-0 flex items-baseline gap-0.5 md:gap-1">
            <div className="flex items-baseline">
              <span className="text-[2.4rem] md:text-[2.8rem] lg:text-[3.2rem] font-extralight tabular-nums text-text-primary leading-none tracking-tight">
                {hours}
              </span>
              <span className="text-[2.4rem] md:text-[2.8rem] lg:text-[3.2rem] font-extralight text-text-muted leading-none tracking-tight mx-0.5">:</span>
              <span className="text-[2.4rem] md:text-[2.8rem] lg:text-[3.2rem] font-extralight tabular-nums text-text-primary leading-none tracking-tight">
                {minutes}
              </span>
            </div>
            {period && (
              <span className="text-[10px] md:text-xs lg:text-sm font-light text-text-muted self-end mb-0.5 md:mb-1 lg:mb-1.5 tracking-wide">
                {period}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
})
