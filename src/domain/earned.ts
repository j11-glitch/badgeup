import { FOUNDER, LEVELS, MANUAL_BADGE_IDS, MANUAL_BADGES, MANUAL_MILESTONES, TASK_BADGES, type BadgeInfo } from './catalog'
import type { ManualAwards, ManualProgress, TaskProgress } from './progress'

export interface EarnedBadge {
  readonly id: string
  readonly badge: BadgeInfo
  readonly count?: number
}

/**
 * Every badge a child has right now, best first: the level, then the task badges, Master and
 * Milestone, the manual badges, and Founder diamonds. Only the highest level is listed.
 */
export function earnedBadges(
  tasks: TaskProgress,
  manual: ManualProgress,
  awards: ManualAwards,
  diamonds: number,
): EarnedBadge[] {
  const list: EarnedBadge[] = []
  if (tasks.level >= 0) {
    const level = LEVELS[tasks.level]
    list.push({ id: level.id, badge: level })
  }
  if (tasks.bigStreak) list.push({ id: 'bigStreak', badge: TASK_BADGES.bigStreak })
  if (tasks.streak) list.push({ id: 'streak', badge: TASK_BADGES.streak })
  if (tasks.onARoll) list.push({ id: 'onARoll', badge: TASK_BADGES.onARoll })
  if (manual.master) list.push({ id: 'master', badge: MANUAL_MILESTONES.master })
  if (manual.milestone) list.push({ id: 'milestone', badge: MANUAL_MILESTONES.milestone })
  for (const id of MANUAL_BADGE_IDS) {
    if (awards[id]) list.push({ id, badge: MANUAL_BADGES[id] })
  }
  if (diamonds > 0) list.push({ id: 'founder', badge: FOUNDER, count: diamonds })
  return list
}
