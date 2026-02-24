import { City } from '../types'

// Full list of searchable cities (40+ cities worldwide)
export const ALL_CITIES: City[] = [
  // Americas
  { id: 'san-francisco', name: 'San Francisco', country: 'United States', countryCode: 'US', timezone: 'America/Los_Angeles', lat: 37.7749, lng: -122.4194 },
  { id: 'los-angeles', name: 'Los Angeles', country: 'United States', countryCode: 'US', timezone: 'America/Los_Angeles', lat: 34.0522, lng: -118.2437 },
  { id: 'seattle', name: 'Seattle', country: 'United States', countryCode: 'US', timezone: 'America/Los_Angeles', lat: 47.6062, lng: -122.3321 },
  { id: 'denver', name: 'Denver', country: 'United States', countryCode: 'US', timezone: 'America/Denver', lat: 39.7392, lng: -104.9903 },
  { id: 'chicago', name: 'Chicago', country: 'United States', countryCode: 'US', timezone: 'America/Chicago', lat: 41.8781, lng: -87.6298 },
  { id: 'new-york', name: 'New York', country: 'United States', countryCode: 'US', timezone: 'America/New_York', lat: 40.7128, lng: -74.0060 },
  { id: 'miami', name: 'Miami', country: 'United States', countryCode: 'US', timezone: 'America/New_York', lat: 25.7617, lng: -80.1918 },
  { id: 'toronto', name: 'Toronto', country: 'Canada', countryCode: 'CA', timezone: 'America/Toronto', lat: 43.6532, lng: -79.3832 },
  { id: 'vancouver', name: 'Vancouver', country: 'Canada', countryCode: 'CA', timezone: 'America/Vancouver', lat: 49.2827, lng: -123.1207 },
  { id: 'mexico-city', name: 'Mexico City', country: 'Mexico', countryCode: 'MX', timezone: 'America/Mexico_City', lat: 19.4326, lng: -99.1332 },
  { id: 'sao-paulo', name: 'São Paulo', country: 'Brazil', countryCode: 'BR', timezone: 'America/Sao_Paulo', lat: -23.5505, lng: -46.6333 },
  { id: 'buenos-aires', name: 'Buenos Aires', country: 'Argentina', countryCode: 'AR', timezone: 'America/Argentina/Buenos_Aires', lat: -34.6037, lng: -58.3816 },
  { id: 'bogota', name: 'Bogotá', country: 'Colombia', countryCode: 'CO', timezone: 'America/Bogota', lat: 4.7110, lng: -74.0721 },
  // Europe
  { id: 'london', name: 'London', country: 'United Kingdom', countryCode: 'GB', timezone: 'Europe/London', lat: 51.5074, lng: -0.1278 },
  { id: 'dublin', name: 'Dublin', country: 'Ireland', countryCode: 'IE', timezone: 'Europe/Dublin', lat: 53.3498, lng: -6.2603 },
  { id: 'paris', name: 'Paris', country: 'France', countryCode: 'FR', timezone: 'Europe/Paris', lat: 48.8566, lng: 2.3522 },
  { id: 'madrid', name: 'Madrid', country: 'Spain', countryCode: 'ES', timezone: 'Europe/Madrid', lat: 40.4168, lng: -3.7038 },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', timezone: 'Europe/Amsterdam', lat: 52.3676, lng: 4.9041 },
  { id: 'berlin', name: 'Berlin', country: 'Germany', countryCode: 'DE', timezone: 'Europe/Berlin', lat: 52.5200, lng: 13.4050 },
  { id: 'rome', name: 'Rome', country: 'Italy', countryCode: 'IT', timezone: 'Europe/Rome', lat: 41.9028, lng: 12.4964 },
  { id: 'zurich', name: 'Zurich', country: 'Switzerland', countryCode: 'CH', timezone: 'Europe/Zurich', lat: 47.3769, lng: 8.5417 },
  { id: 'stockholm', name: 'Stockholm', country: 'Sweden', countryCode: 'SE', timezone: 'Europe/Stockholm', lat: 59.3293, lng: 18.0686 },
  { id: 'oslo', name: 'Oslo', country: 'Norway', countryCode: 'NO', timezone: 'Europe/Oslo', lat: 59.9139, lng: 10.7522 },
  { id: 'helsinki', name: 'Helsinki', country: 'Finland', countryCode: 'FI', timezone: 'Europe/Helsinki', lat: 60.1699, lng: 24.9384 },
  { id: 'warsaw', name: 'Warsaw', country: 'Poland', countryCode: 'PL', timezone: 'Europe/Warsaw', lat: 52.2297, lng: 21.0122 },
  { id: 'moscow', name: 'Moscow', country: 'Russia', countryCode: 'RU', timezone: 'Europe/Moscow', lat: 55.7558, lng: 37.6173 },
  { id: 'istanbul', name: 'Istanbul', country: 'Turkey', countryCode: 'TR', timezone: 'Europe/Istanbul', lat: 41.0082, lng: 28.9784 },
  { id: 'athens', name: 'Athens', country: 'Greece', countryCode: 'GR', timezone: 'Europe/Athens', lat: 37.9838, lng: 23.7275 },
  // Middle East & Africa
  { id: 'dubai', name: 'Dubai', country: 'UAE', countryCode: 'AE', timezone: 'Asia/Dubai', lat: 25.2048, lng: 55.2708 },
  { id: 'riyadh', name: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA', timezone: 'Asia/Riyadh', lat: 24.7136, lng: 46.6753 },
  { id: 'tel-aviv', name: 'Tel Aviv', country: 'Israel', countryCode: 'IL', timezone: 'Asia/Jerusalem', lat: 32.0853, lng: 34.7818 },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', countryCode: 'EG', timezone: 'Africa/Cairo', lat: 30.0444, lng: 31.2357 },
  { id: 'nairobi', name: 'Nairobi', country: 'Kenya', countryCode: 'KE', timezone: 'Africa/Nairobi', lat: -1.2921, lng: 36.8219 },
  { id: 'lagos', name: 'Lagos', country: 'Nigeria', countryCode: 'NG', timezone: 'Africa/Lagos', lat: 6.5244, lng: 3.3792 },
  { id: 'johannesburg', name: 'Johannesburg', country: 'South Africa', countryCode: 'ZA', timezone: 'Africa/Johannesburg', lat: -26.2041, lng: 28.0473 },
  // Asia & Pacific
  { id: 'mumbai', name: 'Mumbai', country: 'India', countryCode: 'IN', timezone: 'Asia/Kolkata', lat: 19.0760, lng: 72.8777 },
  { id: 'delhi', name: 'Delhi', country: 'India', countryCode: 'IN', timezone: 'Asia/Kolkata', lat: 28.7041, lng: 77.1025 },
  { id: 'kolkata', name: 'Kolkata', country: 'India', countryCode: 'IN', timezone: 'Asia/Kolkata', lat: 22.5726, lng: 88.3639 },
  { id: 'dhaka', name: 'Dhaka', country: 'Bangladesh', countryCode: 'BD', timezone: 'Asia/Dhaka', lat: 23.8103, lng: 90.4125 },
  { id: 'colombo', name: 'Colombo', country: 'Sri Lanka', countryCode: 'LK', timezone: 'Asia/Colombo', lat: 6.9271, lng: 79.8612 },
  { id: 'karachi', name: 'Karachi', country: 'Pakistan', countryCode: 'PK', timezone: 'Asia/Karachi', lat: 24.8607, lng: 67.0011 },
  { id: 'tashkent', name: 'Tashkent', country: 'Uzbekistan', countryCode: 'UZ', timezone: 'Asia/Tashkent', lat: 41.2995, lng: 69.2401 },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', countryCode: 'TH', timezone: 'Asia/Bangkok', lat: 13.7563, lng: 100.5018 },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', countryCode: 'SG', timezone: 'Asia/Singapore', lat: 1.3521, lng: 103.8198 },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY', timezone: 'Asia/Kuala_Lumpur', lat: 3.1390, lng: 101.6869 },
  { id: 'jakarta', name: 'Jakarta', country: 'Indonesia', countryCode: 'ID', timezone: 'Asia/Jakarta', lat: -6.2088, lng: 106.8456 },
  { id: 'manila', name: 'Manila', country: 'Philippines', countryCode: 'PH', timezone: 'Asia/Manila', lat: 14.5995, lng: 120.9842 },
  { id: 'ho-chi-minh', name: 'Ho Chi Minh', country: 'Vietnam', countryCode: 'VN', timezone: 'Asia/Ho_Chi_Minh', lat: 10.8231, lng: 106.6297 },
  { id: 'shanghai', name: 'Shanghai', country: 'China', countryCode: 'CN', timezone: 'Asia/Shanghai', lat: 31.2304, lng: 121.4737 },
  { id: 'beijing', name: 'Beijing', country: 'China', countryCode: 'CN', timezone: 'Asia/Shanghai', lat: 39.9042, lng: 116.4074 },
  { id: 'hong-kong', name: 'Hong Kong', country: 'China', countryCode: 'HK', timezone: 'Asia/Hong_Kong', lat: 22.3193, lng: 114.1694 },
  { id: 'taipei', name: 'Taipei', country: 'Taiwan', countryCode: 'TW', timezone: 'Asia/Taipei', lat: 25.0330, lng: 121.5654 },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', countryCode: 'KR', timezone: 'Asia/Seoul', lat: 37.5665, lng: 126.9780 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', countryCode: 'JP', timezone: 'Asia/Tokyo', lat: 35.6762, lng: 139.6503 },
  { id: 'osaka', name: 'Osaka', country: 'Japan', countryCode: 'JP', timezone: 'Asia/Tokyo', lat: 34.6937, lng: 135.5023 },
  // Oceania
  { id: 'sydney', name: 'Sydney', country: 'Australia', countryCode: 'AU', timezone: 'Australia/Sydney', lat: -33.8688, lng: 151.2093 },
  { id: 'melbourne', name: 'Melbourne', country: 'Australia', countryCode: 'AU', timezone: 'Australia/Melbourne', lat: -37.8136, lng: 144.9631 },
  { id: 'brisbane', name: 'Brisbane', country: 'Australia', countryCode: 'AU', timezone: 'Australia/Brisbane', lat: -27.4698, lng: 153.0251 },
  { id: 'perth', name: 'Perth', country: 'Australia', countryCode: 'AU', timezone: 'Australia/Perth', lat: -31.9505, lng: 115.8605 },
  { id: 'auckland', name: 'Auckland', country: 'New Zealand', countryCode: 'NZ', timezone: 'Pacific/Auckland', lat: -36.8509, lng: 174.7645 },
  { id: 'honolulu', name: 'Honolulu', country: 'United States', countryCode: 'US', timezone: 'Pacific/Honolulu', lat: 21.3069, lng: -157.8583 },
]

// Default cities shown on first load
export const DEFAULT_CITY_IDS = [
  'san-francisco',
  'new-york',
  'london',
  'shanghai',
  'tokyo',
]

export const DEFAULT_BASE_CITY_ID = 'new-york'

// Quick lookup by id
export const CITY_BY_ID = new Map<string, City>(
  ALL_CITIES.map((c) => [c.id, c])
)
