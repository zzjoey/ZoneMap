import { useCallback } from 'react'
import { City } from '../../types'
import { dateToMinutesOfDay } from '../../utils/timeUtils'

interface TimeSliderProps {
  baseTime: Date
  baseCity: City
  onChange: (minutes: number) => void
}

/**
 * Full-day (0–1439 minutes) slider for adjusting base time.
 * Styled with a custom track/thumb via CSS in index.css.
 */
export function TimeSlider({ baseTime, baseCity, onChange }: TimeSliderProps) {
  const currentMinutes = dateToMinutesOfDay(baseTime, baseCity.timezone)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value))
    },
    [onChange]
  )

  return (
    <div className="flex-1 flex items-center mx-3 h-[22px]">
      <input
        type="range"
        min={0}
        max={1439}
        step={1}
        value={currentMinutes}
        onChange={handleChange}
        className="w-full"
        aria-label="Adjust base time"
      />
    </div>
  )
}
