import { formatInTimeZone, getTimezoneOffset } from 'date-fns-tz'
import { format, addMinutes } from 'date-fns'

/**
 * Format a UTC date as HH:mm in a given IANA timezone.
 */
export function formatCityTime(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'HH:mm')
}

/**
 * Returns split time parts for rendering animated digits.
 * In 12h mode returns period ("AM"/"PM"); in 24h mode period is null.
 */
export function formatCityTimeParts(
  date: Date,
  timezone: string,
  use12h: boolean
): { hours: string; minutes: string; period: string | null } {
  if (use12h) {
    return {
      hours: formatInTimeZone(date, timezone, 'h'),
      minutes: formatInTimeZone(date, timezone, 'mm'),
      period: formatInTimeZone(date, timezone, 'a'),
    }
  }
  const [hours, minutes] = formatInTimeZone(date, timezone, 'HH:mm').split(':')
  return { hours, minutes, period: null }
}

/**
 * Format time as a single display string, respecting 12/24h preference.
 * 24h → "14:30", 12h → "2:30 AM"
 */
export function formatCityTimeStr(
  date: Date,
  timezone: string,
  use12h: boolean
): string {
  return formatInTimeZone(date, timezone, use12h ? 'h:mm a' : 'HH:mm')
}

/**
 * Format date as day-of-week abbreviation (Mon, Tue, etc.) in a timezone.
 */
export function formatCityDay(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'EEE')
}

/**
 * Format a full date string (e.g. "Mon, Jan 15") in a timezone.
 */
export function formatCityDate(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'EEE, MMM d')
}

/**
 * Compute the local hour + fractional minute (0..24) for a city.
 * Used for working-hours timeline positioning.
 */
export function getLocalHourDecimal(date: Date, timezone: string): number {
  const localStr = formatInTimeZone(date, timezone, 'HH:mm')
  const [h, m] = localStr.split(':').map(Number)
  return h + m / 60
}

/**
 * Get the UTC offset in milliseconds for a timezone at a given date.
 * date-fns-tz v3: getTimezoneOffset returns milliseconds.
 */
export function getTzOffsetMs(timezone: string, date: Date): number {
  return getTimezoneOffset(timezone, date)
}

/**
 * Calculate the human-readable time difference string between a city and the base city.
 * Returns "Base", "+5h", "-8h", "+5h 30m", etc.
 */
export function getRelativeOffset(
  cityTimezone: string,
  baseCityTimezone: string,
  date: Date
): string {
  if (cityTimezone === baseCityTimezone) return 'Base'

  const cityOffsetMs = getTimezoneOffset(cityTimezone, date)
  const baseOffsetMs = getTimezoneOffset(baseCityTimezone, date)
  const diffMs = cityOffsetMs - baseOffsetMs
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes === 0) return 'Base'

  const sign = diffMinutes > 0 ? '+' : '-'
  const absMins = Math.abs(diffMinutes)
  const hours = Math.floor(absMins / 60)
  const mins = absMins % 60

  if (mins === 0) return `${sign}${hours}h`
  if (hours === 0) return `${sign}${mins}m`
  return `${sign}${hours}h ${mins}m`
}

/**
 * Parse a "HH:mm" string and return a Date object with those hours/minutes
 * applied in the given timezone, on today's date in that timezone.
 */
export function parseTimeInTimezone(timeStr: string, timezone: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return new Date()

  // Get the current date in the target timezone
  const nowInTz = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
  const [year, month, day] = nowInTz.split('-').map(Number)

  // Build a UTC date that represents the given local time in the timezone
  const localMidnight = new Date(Date.UTC(year, month - 1, day))
  const offsetMs = getTimezoneOffset(timezone, localMidnight)
  // local midnight UTC = midnight - offset
  const utcMidnight = new Date(localMidnight.getTime() - offsetMs)
  return addMinutes(utcMidnight, hours * 60 + minutes)
}

/**
 * Convert a Date to total minutes within the day (0..1439) in a given timezone.
 */
export function dateToMinutesOfDay(date: Date, timezone: string): number {
  const timeStr = formatInTimeZone(date, timezone, 'HH:mm')
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

/**
 * Format HH:mm from total minutes (0..1439).
 */
export function minutesToTimeStr(totalMinutes: number): string {
  const clamped = ((totalMinutes % 1440) + 1440) % 1440
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return format(new Date(0, 0, 0, h, m), 'HH:mm')
}
