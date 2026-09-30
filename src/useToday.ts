import { useEffect, useState } from 'react'
import { dayKey, type DayKey } from './domain/progress'

/** Today's date (local time) and the current time, refreshed every minute so midnight rolls over. */
export function useToday(): { today: DayKey; now: Date } {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return { today: dayKey(now), now }
}
