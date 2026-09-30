// Every badge in BadgeUp. Names and rules are in src/i18n/nb.ts. The icons are cut from
// assets/badges-source.webp by scripts/extract-badge-icons.py and served from public/badges/.
import { nb } from '../i18n/nb'

export interface BadgeInfo {
  readonly name: string
  /** How the badge is earned, shown under the name. */
  readonly rule: string
  readonly icon: string
}

const icon = (file: string) => `/badges/${file}.png`
const T = nb.badges

/** Earned automatically from the daily tasks. */
export const TASK_BADGES = {
  onARoll: { ...T.onARoll, icon: icon('on-a-roll') },
  streak: { ...T.streak, icon: icon('streak') },
  bigStreak: { ...T.bigStreak, icon: icon('big-streak') },
} as const satisfies Record<string, BadgeInfo>

/** Streak levels: all tasks done this many days in a row. A missed day resets them. */
export const LEVELS = [
  { id: 'bronze', days: 7, ...T.bronze, icon: icon('bronze') },
  { id: 'silver', days: 30, ...T.silver, icon: icon('silver') },
  { id: 'gold', days: 90, ...T.gold, icon: icon('gold') },
  { id: 'platinum', days: 180, ...T.platinum, icon: icon('platinum') },
  { id: 'legend', days: 365, ...T.legend, icon: icon('legend') },
] as const

/** Given and taken away by an admin. The ids are stored in Firestore; do not rename them. */
export const MANUAL_BADGES = {
  firstStep: { ...T.firstStep, icon: icon('first-step') },
  gettingStarted: { ...T.gettingStarted, icon: icon('getting-started') },
  betaTester: { ...T.betaTester, icon: icon('beta-tester') },
  helpful: { ...T.helpful, icon: icon('helpful') },
  teamPlayer: { ...T.teamPlayer, icon: icon('team-player') },
  mentor: { ...T.mentor, icon: icon('mentor') },
  collaborator: { ...T.collaborator, icon: icon('collaborator') },
  dedicated: { ...T.dedicated, icon: icon('dedicated') },
  earlyBird: { ...T.earlyBird, icon: icon('early-bird') },
  explorer: { ...T.explorer, icon: icon('explorer') },
  creator: { ...T.creator, icon: icon('creator') },
  patient: { ...T.patient, icon: icon('patient') },
  toothStar: { ...T.toothStar, icon: icon('tooth-star') },
  outdoors: { ...T.outdoors, icon: icon('outdoors') },
  screenSmart: { ...T.screenSmart, icon: icon('screen-smart') },
} as const satisfies Record<string, BadgeInfo>

export type ManualBadgeId = keyof typeof MANUAL_BADGES
export const MANUAL_BADGE_IDS = Object.keys(MANUAL_BADGES) as ManualBadgeId[]

/** Earned automatically from the manual badges. */
export const MANUAL_MILESTONES = {
  milestone: { ...T.milestone, icon: icon('milestone') },
  master: { ...T.master, icon: icon('master') },
} as const satisfies Record<string, BadgeInfo>

/** Founder diamonds: an admin can give several. */
export const FOUNDER: BadgeInfo = { ...T.founder, icon: icon('founder') }

export const LOGO = icon('logo')
