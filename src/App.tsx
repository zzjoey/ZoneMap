import { useState, useMemo, useCallback, useEffect, useDeferredValue } from 'react'
import { AnimatePresence } from 'framer-motion'

import { City } from './types'
import {
  CITY_BY_ID,
  DEFAULT_CITY_IDS,
  DEFAULT_BASE_CITY_ID,
} from './data/cities'

import { useClock } from './hooks/useClock'
import { readUrlState, readLocalState, useUrlSync } from './hooks/useUrlSync'
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
  const { cityIds: urlCityIds, baseCityId: urlBaseCityId, manualTime } = readUrlState()
  const { cities: localCities, baseCityId: localBaseCityId } = readLocalState()

  // Build a supplemental lookup from localStorage for GeoNames cities
  // (those with "geo-" IDs that aren't in the hardcoded CITY_BY_ID map)
  const localById = new Map(localCities.map((c) => [c.id, c]))

  let cities: City[]
  if (urlCityIds.length > 0) {
    // URL takes priority — resolve each ID against hardcoded map, then localStorage
    cities = urlCityIds
      .map((id) => CITY_BY_ID.get(id) ?? localById.get(id))
      .filter((c): c is City => c !== undefined)
      .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
  } else if (localCities.length > 0) {
    // No URL params — restore from localStorage
    cities = localCities
  } else {
    // First-ever visit — use hardcoded defaults
    cities = DEFAULT_CITY_IDS
      .map((id) => CITY_BY_ID.get(id))
      .filter((c): c is City => c !== undefined)
  }

  const baseCityId = urlBaseCityId ?? localBaseCityId

  // Resolve base city
  const baseCity =
    (baseCityId ? (CITY_BY_ID.get(baseCityId) ?? localById.get(baseCityId)) : undefined) ??
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
  const [useAnalog, setUseAnalog] = useState(false)
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('theme') !== 'light'
  )

  // Apply theme to <html>, persist to localStorage, and sync Android nav bar color
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      delete root.dataset.theme
    } else {
      root.dataset.theme = 'light'
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    // Keep theme-color in sync so Android Chrome nav bar matches the app theme
    const meta = document.getElementById('theme-color-meta')
    if (meta) meta.setAttribute('content', isDark ? '#040609' : '#f9fafc')
  }, [isDark])

  const handleToggleTheme = useCallback(() => setIsDark((d) => !d), [])

  // Live clock — only ticks when isLiveMode is true
  const liveClock = useClock(isLiveMode)

  // Effective base time: live clock or manually-set date
  const baseTime = isLiveMode ? liveClock : (manualTime ?? liveClock)

  // Deferred time for expensive renders (WorldMap / TerminatorCanvas).
  // During fast drags, React will skip intermediate deferred renders and
  // only commit the latest value — freeing the main thread for CityCard updates.
  const deferredBaseTime = useDeferredValue(baseTime)

  // Sync state → URL (debounced)
  useUrlSync({ cities, baseCity, baseTime, isLiveMode })

  // ---------------------------------------------------------------------------
  // City management
  // ---------------------------------------------------------------------------
  const handleAddCity = useCallback((city: City) => {
    setCities((prev) => {
      if (prev.find((c) => c.id === city.id)) return prev
      if (prev.length >= 6) return prev
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

  const handleReorder = useCallback((newOrder: City[]) => {
    setCities(newOrder)
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
      {/*
       * Layout:
       *   Mobile  (< md): flex-col — map fixed 52 vh (top), cards section (bottom)
       *   Desktop (≥ md): flex-row — cards left sidebar, map fills remaining space
       */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        {/* World map — fixed 46 vh on mobile (top), fills remaining space on desktop (right) */}
        <div className="order-first md:order-2 h-[46vh] flex-shrink-0 md:flex-1 md:h-auto flex flex-col min-h-0 min-w-0">
          <WorldMap
            cities={cities}
            baseCity={baseCity}
            baseTime={deferredBaseTime}
            use12h={use12h}
            isDark={isDark}
            onCityClick={handleSelectBase}
            onSetFormat={(v) => setUse12h(v)}
            useAnalog={useAnalog}
            onSetAnalog={(v) => setUseAnalog(v)}
            onToggleTheme={handleToggleTheme}
            onTimeChange={handleTimeChange}
          />
        </div>

        {/* City card list — below map on mobile (order-2), left sidebar on desktop (order-1) */}
        <CityCardRow
          cities={cities}
          baseCity={baseCity}
          baseTime={baseTime}
          use12h={use12h}
          useAnalog={useAnalog}
          onSelectBase={handleSelectBase}
          onRemove={handleRemoveCity}
          onAddCity={() => setSearchOpen(true)}
          onReorder={handleReorder}
        />
      </div>

      {/* Time control — always full-width at bottom */}
      <TimeControl
        baseCity={baseCity}
        baseTime={baseTime}
        isLive={isLiveMode}
        use12h={use12h}
        isDark={isDark}
        onTimeChange={handleTimeChange}
        onResetLive={handleResetLive}
      />

      {/* City search overlay */}
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
