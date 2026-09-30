import { describe, expect, it } from 'vitest'
import { earnedBadges } from './earned'
import type { ManualProgress, TaskProgress } from './progress'

const noTasks: TaskProgress = { run: 0, onARoll: false, streak: false, bigStreak: false, level: -1 }
const noManual: ManualProgress = { count: 0, milestone: false, master: false, daysToMaster: null }

describe('earnedBadges', () => {
  it('is empty for a new child', () => {
    expect(earnedBadges(noTasks, noManual, {}, 0)).toEqual([])
  })

  it('lists the highest level first, then task, milestone, manual badges and diamonds', () => {
    const tasks: TaskProgress = { run: 95, onARoll: true, streak: true, bigStreak: true, level: 2 }
    const manual: ManualProgress = { count: 11, milestone: true, master: true, daysToMaster: null }
    const ids = earnedBadges(tasks, manual, { helpful: new Date(), creator: new Date() }, 3).map((b) => b.id)
    expect(ids).toEqual(['gold', 'bigStreak', 'streak', 'onARoll', 'master', 'milestone', 'helpful', 'creator', 'founder'])
  })

  it('carries the diamond count', () => {
    expect(earnedBadges(noTasks, noManual, {}, 4)).toEqual([expect.objectContaining({ id: 'founder', count: 4 })])
  })
})
