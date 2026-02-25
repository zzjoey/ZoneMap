import { useEffect, useRef } from 'react'
import { City } from '../types'
import { formatInTimeZone } from 'date-fns-tz'

interface UrlSyncOptions {
  cities: City[]
  baseCity: City
  baseTime: Date
  isLiveMode: boolean
}

const STORAGE_KEY = 'zonemap:state'

/**
 * Parse initial state from the URL query string.
 * Returns raw strings that the caller resolves against city data.
 */
export function readUrlState(): {
  cityIds: string[]
  baseCityId: string | null
  manualTime: string | null
} {
  const params = new URLSearchParams(window.location.search)
  const citiesParam = params.get('cities')
  const cityIds = citiesParam ? citiesParam.split(',').filter(Boolean) : []
  return {
    cityIds,
    baseCityId: params.get('base'),
    manualTime: params.get('t'),
  }
}

/**
 * Read persisted state from localStorage.
 * Stores full City objects so GeoNames search results survive page reload.
 */
export function readLocalState(): { cities: City[]; baseCityId: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { cities: [], baseCityId: null }
    const parsed = JSON.parse(raw)
    const cities: City[] = Array.isArray(parsed.cities) ? parsed.cities : []
    const baseCityId = typeof parsed.base === 'string' ? parsed.base : null
    return { cities, baseCityId }
  } catch {
    return { cities: [], baseCityId: null }
  }
}

/**
 * Synchronize application state to the URL using replaceState (no history entry).
 * Writes are debounced to avoid thrashing during slider drag.
 */
export function useUrlSync(options: UrlSyncOptions): void {
  const { cities, baseCity, baseTime, isLiveMode } = options

  // Debounce ref
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams()

      if (cities.length > 0) {
        params.set('cities', cities.map((c) => c.id).join(','))
      }
      params.set('base', baseCity.id)

      if (!isLiveMode) {
        // Store the base city's local time (HH:mm) in the URL
        const localTime = formatInTimeZone(baseTime, baseCity.timezone, 'HH:mm')
        params.set('t', localTime)
      }

      const newSearch = `?${params.toString()}`
      if (window.location.search !== newSearch) {
        window.history.replaceState(null, '', newSearch)
      }

      // Persist full City objects + base ID to localStorage.
      // Storing objects (not just IDs) ensures GeoNames search results
      // can be restored without a round-trip to the API on reload.
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        cities,
        base: baseCity.id,
      }))
    }, 500)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [cities, baseCity, baseTime, isLiveMode])
}
