import { useEffect, useRef } from 'react'
import { City } from '../types'
import { formatInTimeZone } from 'date-fns-tz'

interface UrlSyncOptions {
  cities: City[]
  baseCity: City
  baseTime: Date
  isLiveMode: boolean
}

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
    }, 500)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [cities, baseCity, baseTime, isLiveMode])
}
