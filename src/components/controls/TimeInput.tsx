import { useState, useEffect } from 'react'
import { formatCityTime, formatCityTimeStr } from '../../utils/timeUtils'
import { City } from '../../types'

interface TimeInputProps {
  baseTime: Date
  baseCity: City
  use12h: boolean
  onChange: (timeStr: string) => void
}

/**
 * Time input that stays in sync with baseTime.
 * Displays in 12h or 24h format; always edits in 24h ("HH:mm").
 */
export function TimeInput({ baseTime, baseCity, use12h, onChange }: TimeInputProps) {
  const [localValue, setLocalValue] = useState(() =>
    formatCityTimeStr(baseTime, baseCity.timezone, use12h)
  )
  const [isFocused, setIsFocused] = useState(false)

  // Keep in sync when baseTime changes or format toggles
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(formatCityTimeStr(baseTime, baseCity.timezone, use12h))
    }
  }, [baseTime, baseCity, isFocused, use12h])

  function handleFocus() {
    setIsFocused(true)
    // Switch to 24h for editing regardless of display format
    setLocalValue(formatCityTime(baseTime, baseCity.timezone))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalValue(e.target.value)
  }

  function handleBlur() {
    setIsFocused(false)
    if (/^\d{1,2}:\d{2}$/.test(localValue)) {
      onChange(localValue)
    } else {
      setLocalValue(formatCityTimeStr(baseTime, baseCity.timezone, use12h))
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  // 12h display values like "2:30 AM" need more width
  const displayWidth = use12h && !isFocused ? 'w-24' : 'w-20'

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      maxLength={isFocused ? 5 : 8}
      placeholder="HH:mm"
      className={`
        ${displayWidth} bg-transparent border-0 border-b-2 border-border
        text-text-primary text-base font-light tabular-nums text-center
        focus:outline-none focus:border-accent-green
        transition-colors duration-200 cursor-text pb-0.5
      `}
    />
  )
}
