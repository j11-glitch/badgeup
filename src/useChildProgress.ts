import { useCallback } from 'react'
import { watchDays } from './data/days'
import type { Child } from './data/users'
import { earnedBadges, type EarnedBadge } from './domain/earned'
import { manualProgress, taskProgress, type DayKey, type DayRecord, type ManualProgress, type TaskProgress } from './domain/progress'
import { useLive } from './useLive'

export interface ChildProgress {
  readonly days: ReadonlyMap<DayKey, DayRecord>
  readonly tasks: TaskProgress
  readonly manual: ManualProgress
  readonly earned: readonly EarnedBadge[]
}

/** Live task history of a child and every badge worked out from it; null while loading. */
export function useChildProgress(
  child: Child,
  today: DayKey,
  now: Date,
): { progress: ChildProgress | null; error: string | null } {
  const watch = useCallback(
    (onDays: (days: Map<DayKey, DayRecord>) => void, onError: (e: Error) => void) =>
      watchDays(child.id, today, onDays, onError),
    [child.id, today],
  )
  const days = useLive(watch)
  if (!days.data) return { progress: null, error: days.error }
  const tasks = taskProgress(days.data, today)
  const manual = manualProgress(child.manual, now)
  return {
    progress: { days: days.data, tasks, manual, earned: earnedBadges(tasks, manual, child.manual, child.diamonds) },
    error: days.error,
  }
}
