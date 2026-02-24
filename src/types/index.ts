// Core city data structure
export interface City {
  id: string
  name: string
  country: string
  countryCode: string // ISO 3166-1 alpha-2
  timezone: string // IANA timezone string, e.g. "America/Los_Angeles"
  lat: number
  lng: number
}

// Application global state (managed in App.tsx)
export interface AppState {
  cities: City[]
  baseCity: City
  baseTime: Date
  isLiveMode: boolean
}

// City search result with "already added" flag
export interface SearchResult extends City {
  alreadyAdded: boolean
}

// Projection functions returned by useMapProjection hook
export type ProjectFn = (lonLat: [number, number]) => [number, number] | null
export type InverseProjectFn = (x: number, y: number) => [number, number] | null

// Map size
export interface MapSize {
  width: number
  height: number
}

// URL state for synchronization
export interface UrlState {
  cityIds: string[]
  baseCityId: string
  manualTime?: string // "HH:mm" format
}
