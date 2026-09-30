import { LEVELS, MANUAL_BADGE_IDS, type ManualBadgeId } from './catalog'

/** A calendar day in the child's local time, as "YYYY-MM-DD" (also the Firestore document id). */
export type DayKey = string

export interface DayRecord {
  /** The tasks the child had that day (a snapshot, so later task changes do not rewrite history). */
  readonly required: readonly string[]
  readonly done: readonly string[]
}

export const STREAK_DAYS = 7
export const BIG_STREAK_DAYS = 30
export const MASTER_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

const pad = (n: number) => String(n).padStart(2, '0')

export function dayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The day before `key`. Uses calendar arithmetic, so daylight-saving changes do not matter. */
export function previousDay(key: DayKey): DayKey {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d - 1))
}

export function isComplete(day: DayRecord | undefined): boolean {
  return !!day && day.required.length > 0 && day.required.every((task) => day.done.includes(task))
}

/**
 * Days in a row with every task done. Today counts once it is complete; until then the run
 * ends yesterday, because today is not over and the streak is not broken yet.
 */
export function currentRun(days: ReadonlyMap<DayKey, DayRecord>, today: DayKey): number {
  let day = isComplete(days.get(today)) ? today : previousDay(today)
  let run = 0
  while (isComplete(days.get(day))) {
    run += 1
    day = previousDay(day)
  }
  return run
}

export interface TaskProgress {
  readonly run: number
  readonly onARoll: boolean
  readonly streak: boolean
  readonly bigStreak: boolean
  /** Index into LEVELS of the highest level reached, or -1. */
  readonly level: number
}

export function taskProgress(days: ReadonlyMap<DayKey, DayRecord>, today: DayKey): TaskProgress {
  const run = currentRun(days, today)
  let level = -1
  LEVELS.forEach((l, i) => {
    if (run >= l.days) level = i
  })
  return {
    run,
    onARoll: isComplete(days.get(today)),
    streak: run >= STREAK_DAYS,
    bigStreak: run >= BIG_STREAK_DAYS,
    level,
  }
}

/** When each manual badge was given (only badges the child has now). */
export type ManualAwards = Partial<Record<ManualBadgeId, Date>>

export interface ManualProgress {
  readonly count: number
  readonly milestone: boolean
  readonly master: boolean
  /** Days left until Master while Milestone is held, else null. */
  readonly daysToMaster: number | null
}

/**
 * Milestone = every manual badge at once. Master = Milestone kept for a week, counted from the
 * last badge given. Taking any badge away loses both; giving it back starts the week again.
 */
export function manualProgress(awards: ManualAwards, now: Date): ManualProgress {
  const dates = MANUAL_BADGE_IDS.map((id) => awards[id]).filter((d): d is Date => d !== undefined)
  const milestone = dates.length === MANUAL_BADGE_IDS.length
  if (!milestone) return { count: dates.length, milestone, master: false, daysToMaster: null }
  const since = Math.max(...dates.map((d) => d.getTime()))
  const left = Math.ceil((since + MASTER_DAYS * DAY_MS - now.getTime()) / DAY_MS)
  return { count: dates.length, milestone, master: left <= 0, daysToMaster: left > 0 ? left : null }
}
