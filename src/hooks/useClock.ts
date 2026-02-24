import { useState, useEffect } from 'react'

/**
 * Returns the current time, updating on each minute boundary.
 * Uses a cascading setTimeout approach to fire exactly at :00 seconds,
 * avoiding the drift caused by a plain setInterval.
 *
 * @param isLive - When false the hook freezes at the initial time and won't tick.
 */
export function useClock(isLive: boolean): Date {
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    if (!isLive) return

    function tick() {
      setNow(new Date())
    }

    // Immediately sync to the real current time
    tick()

    // Wait until the next whole minute, then tick every 60 seconds
    const msToNextMinute = 60_000 - (Date.now() % 60_000)

    let intervalId: ReturnType<typeof setInterval> | null = null

    const timeoutId = setTimeout(() => {
      tick()
      intervalId = setInterval(tick, 60_000)
    }, msToNextMinute)

    return () => {
      clearTimeout(timeoutId)
      if (intervalId !== null) clearInterval(intervalId)
    }
  }, [isLive])

  return now
}
