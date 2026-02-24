import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'

import { City } from './types'
import {
  CITY_BY_ID,
  DEFAULT_CITY_IDS,
  DEFAULT_BASE_CITY_ID,
} from './data/cities'

import { useClock } from './hooks/useClock'
import { readUrlState, useUrlSync } from './hooks/useUrlSync'
import { parseTimeInTimezone } from './utils/timeUtils'

import { AppShell } from './components/layout/AppShell'
import { CityCardRow } from './components/cards/CityCardRow'
import { WorldMap } from './components/map/WorldMap'
import { TimeControl } from './components/controls/TimeControl'
import { CitySearch } from './components/search/CitySearch'

// ---------------------------------------------------------------------------
// Initialise from URL state on first render
// ---------------------------------------------------------------------------
function resolveInitialState() {
  const { cityIds, baseCityId, manualTime } = readUrlState()

  // Resolve cities from URL or fall back to defaults
  const resolvedIds = cityIds.length > 0 ? cityIds : DEFAULT_CITY_IDS
  const cities = resolvedIds
    .map((id) => CITY_BY_ID.get(id))
    .filter((c): c is City => c !== undefined)
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i) // dedupe

  // Resolve base city
  const baseCity =
    (baseCityId ? CITY_BY_ID.get(baseCityId) : undefined) ??
    cities.find((c) => c.id === DEFAULT_BASE_CITY_ID) ??
    cities[0]

  const isLiveMode = !manualTime

  // Resolve manual time if present
  let manualDate: Date | null = null
  if (manualTime && baseCity && /^\d{1,2}:\d{2}$/.test(manualTime)) {
    manualDate = parseTimeInTimezone(manualTime, baseCity.timezone)
  }

  return { cities, baseCity, isLiveMode, manualDate }
}

const INITIAL = resolveInitialState()

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  const [cities, setCities] = useState<City[]>(INITIAL.cities)
  const [baseCity, setBaseCity] = useState<City>(INITIAL.baseCity)
  const [isLiveMode, setIsLiveMode] = useState<boolean>(INITIAL.isLiveMode)
  const [manualTime, setManualTime] = useState<Date | null>(INITIAL.manualDate)
  const [searchOpen, setSearchOpen] = useState(false)
  const [use12h, setUse12h] = useState(false)

  // Live clock — only ticks when isLiveMode is true
  const liveClock = useClock(isLiveMode)

  // Effective base time: live clock or manually-set date
  const baseTime = isLiveMode ? liveClock : (manualTime ?? liveClock)

  // Sync state → URL (debounced)
  useUrlSync({ cities, baseCity, baseTime, isLiveMode })

  // ---------------------------------------------------------------------------
  // City management
  // ---------------------------------------------------------------------------
  const handleAddCity = useCallback((city: City) => {
    setCities((prev) => {
      if (prev.find((c) => c.id === city.id)) return prev
      return [...prev, city]
    })
  }, [])

  const handleRemoveCity = useCallback(
    (cityId: string) => {
      setCities((prev) => {
        const next = prev.filter((c) => c.id !== cityId)
        // If the removed city was the base, switch to the first remaining
        if (baseCity.id === cityId && next.length > 0) {
          setBaseCity(next[0])
        }
        return next
      })
    },
    [baseCity.id]
  )

  const handleSelectBase = useCallback((city: City) => {
    setBaseCity(city)
  }, [])

  // ---------------------------------------------------------------------------
  // Time management
  // ---------------------------------------------------------------------------
  const handleTimeChange = useCallback((date: Date) => {
    setIsLiveMode(false)
    setManualTime(date)
  }, [])

  const handleResetLive = useCallback(() => {
    setIsLiveMode(true)
    setManualTime(null)
  }, [])

  // Set of existing city IDs for the search overlay
  const existingCityIds = useMemo(
    () => new Set(cities.map((c) => c.id)),
    [cities]
  )

  return (
    <AppShell>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left: vertical city card list ─────────────────── */}
        <CityCardRow
          cities={cities}
          baseCity={baseCity}
          baseTime={baseTime}
          use12h={use12h}
          onSelectBase={handleSelectBase}
          onRemove={handleRemoveCity}
          onAddCity={() => setSearchOpen(true)}
        />

        {/* ── Right: map + time control ──────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          <WorldMap
            cities={cities}
            baseCity={baseCity}
            baseTime={baseTime}
            use12h={use12h}
            onCityClick={handleSelectBase}
            onSetFormat={(v) => setUse12h(v)}
          />

          <TimeControl
            baseCity={baseCity}
            baseTime={baseTime}
            isLive={isLiveMode}
            use12h={use12h}
            onTimeChange={handleTimeChange}
            onResetLive={handleResetLive}
          />
        </div>
      </div>

      {/* ── City search overlay ─────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <CitySearch
            existingCityIds={existingCityIds}
            onAdd={handleAddCity}
            onClose={() => setSearchOpen(false)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  )
}
