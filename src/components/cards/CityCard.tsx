import { motion, AnimatePresence } from 'framer-motion'
import { City } from '../../types'
import { formatCityTimeParts, formatCityDate, getRelativeOffset } from '../../utils/timeUtils'
import { useState } from 'react'

interface CityCardProps {
  city: City
  baseCity: City
  baseTime: Date
  use12h: boolean
  isActive: boolean
  onSelect: (city: City) => void
  onRemove: (cityId: string) => void
}

/**
 * Individual city time card. Shows the city's local time, name, country,
 * relative offset vs base city, and date. Active (base) card is green-highlighted.
 */
export function CityCard({ city, baseCity, baseTime, use12h, isActive, onSelect, onRemove }: CityCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const { hours, minutes, period } = formatCityTimeParts(baseTime, city.timezone, use12h)
  const localDate = formatCityDate(baseTime, city.timezone)
  const offset = getRelativeOffset(city.timezone, baseCity.timezone, baseTime)

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    onRemove(city.id)
  }

  return (
    <motion.div
      layout
      layoutId={city.id}
      initial={{ opacity: 0, x: 16, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(city)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative w-full rounded-card px-5 py-5 cursor-pointer
        border transition-colors duration-300
        ${isActive
          ? 'bg-bg-card-active border-accent-green-border card-glow'
          : 'bg-bg-card border-border hover:border-[#263450]'
        }
      `}
    >
      {/* Remove button — appears on hover */}
      <AnimatePresence>
        {isHovered && !isActive && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            onClick={handleRemove}
            className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center
                       rounded-full text-text-muted hover:text-text-primary hover:bg-white/10
                       text-base leading-none transition-colors z-10"
          >
            ×
          </motion.button>
        )}
      </AnimatePresence>

      {/* Offset badge */}
      <div className="mb-4">
        {isActive ? (
          <span className="text-sm font-semibold text-accent-green uppercase tracking-widest flex items-center gap-1.5">
            <motion.span
              className="w-2 h-2 rounded-full bg-accent-green inline-block"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            />
            Base
          </span>
        ) : (
          <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full text-accent-green bg-accent-green-dim border border-accent-green/20">
            {offset}
          </span>
        )}
      </div>

      {/* Main row: city info (left) + time (right) */}
      <div className="flex items-end justify-between gap-3">
        {/* Left: city name + country + date */}
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-text-primary tracking-wide uppercase truncate">
            {city.name}
          </div>
          <div className="text-[13px] text-text-secondary truncate mt-1">
            {city.country}
          </div>
          <div className="text-[13px] text-text-muted truncate mt-0.5">
            {localDate}
          </div>
        </div>

        {/* Right: large time */}
        <div className="flex-shrink-0 flex items-baseline gap-1">
          <div className="flex items-baseline">
            <AnimatePresence mode="wait">
              <motion.span
                key={`h-${city.id}-${hours}`}
                className="text-[3.2rem] font-extralight tabular-nums text-text-primary leading-none tracking-tight"
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {hours}
              </motion.span>
            </AnimatePresence>
            <span className="text-[3.2rem] font-extralight text-text-muted leading-none tracking-tight mx-0.5">:</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={`m-${city.id}-${minutes}`}
                className="text-[3.2rem] font-extralight tabular-nums text-text-primary leading-none tracking-tight"
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {minutes}
              </motion.span>
            </AnimatePresence>
          </div>
          {period && (
            <span className="text-sm font-light text-text-muted self-end mb-1.5 tracking-wide">
              {period}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
