import { describe, expect, it } from 'vitest'
import { MANUAL_BADGE_IDS, type ManualBadgeId } from './catalog'
import {
  currentRun,
  dayKey,
  isComplete,
  manualProgress,
  previousDay,
  taskProgress,
  type DayKey,
  type DayRecord,
  type ManualAwards,
} from './progress'

const TODAY = '2026-03-31'
const done: DayRecord = { required: ['a', 'b'], done: ['b', 'a'] }
const half: DayRecord = { required: ['a', 'b'], done: ['a'] }

/** `count` complete days ending `endOffset` days before TODAY. */
function run(count: number, endOffset = 0, extra: Record<DayKey, DayRecord> = {}): Map<DayKey, DayRecord> {
  const days = new Map<DayKey, DayRecord>()
  let key = TODAY
  for (let i = 0; i < endOffset; i++) key = previousDay(key)
  for (let i = 0; i < count; i++) {
    days.set(key, done)
    key = previousDay(key)
  }
  for (const [k, v] of Object.entries(extra)) days.set(k, v)
  return days
}

describe('days', () => {
  it('formats local dates and steps back across months, years and DST', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(previousDay('2026-03-01')).toBe('2026-02-28')
    expect(previousDay('2026-01-01')).toBe('2025-12-31')
    expect(previousDay('2026-03-30')).toBe('2026-03-29') // Norway switches to summer time on 29 March 2026
    expect(previousDay('2028-03-01')).toBe('2028-02-29')
  })

  it('a day is complete only when every task of that day is done', () => {
    expect(isComplete(done)).toBe(true)
    expect(isComplete(half)).toBe(false)
    expect(isComplete({ required: [], done: [] })).toBe(false)
    expect(isComplete(undefined)).toBe(false)
  })
})

describe('task badges', () => {
  it('On a Roll needs today complete', () => {
    expect(taskProgress(run(1), TODAY).onARoll).toBe(true)
    expect(taskProgress(run(3, 1, { [TODAY]: half }), TODAY).onARoll).toBe(false)
  })

  it('an unfinished today does not break the streak yet', () => {
    expect(currentRun(run(7, 1), TODAY)).toBe(7)
    expect(currentRun(run(7, 1, { [TODAY]: half }), TODAY)).toBe(7)
    expect(taskProgress(run(7, 1), TODAY).streak).toBe(true)
  })

  it('a missed day resets the run', () => {
    expect(currentRun(run(6, 2), TODAY)).toBe(0)
    const days = run(3)
    for (const [k, v] of run(40, 4)) days.set(k, v) // day 3 before today was missed
    expect(currentRun(days, TODAY)).toBe(3)
  })

  it('Streak at 7 days and Big Streak at 30', () => {
    expect(taskProgress(run(6), TODAY)).toMatchObject({ streak: false, bigStreak: false })
    expect(taskProgress(run(7), TODAY)).toMatchObject({ streak: true, bigStreak: false })
    expect(taskProgress(run(29), TODAY)).toMatchObject({ bigStreak: false, level: 0 })
    expect(taskProgress(run(30), TODAY)).toMatchObject({ streak: true, bigStreak: true })
  })

  it('levels by days in a row: Bronze 7, Silver 30, Gold 90, Platinum 180, Legend 365', () => {
    const level = (days: number) => taskProgress(run(days), TODAY).level
    expect([level(6), level(7), level(29), level(30), level(89), level(90), level(180), level(364), level(365)]).toEqual([
      -1, 0, 0, 1, 1, 2, 3, 3, 4,
    ])
  })

  it('everything resets after a missed day, even Legend', () => {
    expect(taskProgress(run(400, 2), TODAY)).toMatchObject({ run: 0, streak: false, bigStreak: false, level: -1 })
  })
})

describe('manual badges', () => {
  const NOW = new Date('2026-03-31T12:00:00Z')
  const all = (given: Date, except: ManualBadgeId[] = []): ManualAwards =>
    Object.fromEntries(MANUAL_BADGE_IDS.filter((id) => !except.includes(id)).map((id) => [id, given]))
  const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000)

  it('Milestone needs every manual badge', () => {
    expect(manualProgress({}, NOW)).toMatchObject({ count: 0, milestone: false, master: false })
    const total = MANUAL_BADGE_IDS.length
    expect(manualProgress(all(daysAgo(30), ['creator']), NOW)).toMatchObject({ count: total - 1, milestone: false, master: false })
    expect(manualProgress(all(daysAgo(0)), NOW)).toMatchObject({ count: total, milestone: true, master: false, daysToMaster: 7 })
  })

  it('Master after keeping Milestone for 7 days, counted from the last badge given', () => {
    expect(manualProgress(all(daysAgo(6)), NOW)).toMatchObject({ master: false, daysToMaster: 1 })
    expect(manualProgress(all(daysAgo(7)), NOW)).toMatchObject({ master: true, daysToMaster: null })
    expect(manualProgress({ ...all(daysAgo(20)), creator: daysAgo(2) }, NOW)).toMatchObject({ master: false, daysToMaster: 5 })
  })
})
