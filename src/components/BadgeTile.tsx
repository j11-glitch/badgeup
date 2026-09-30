import type { BadgeInfo } from '../domain/catalog'
import { nb } from '../i18n/nb'

interface BadgeTileProps {
  readonly badge: BadgeInfo
  readonly earned: boolean
  /** Shown instead of the rule, e.g. "3 dager igjen". */
  readonly detail?: string
  /** For badges that can be earned several times. */
  readonly count?: number
}

/** A badge icon with its name; badges not earned yet are shown as dim silhouettes. */
export function BadgeTile({ badge, earned, detail, count }: BadgeTileProps) {
  const status = earned ? nb.earned : nb.notEarned
  return (
    <li className={`tile${earned ? ' tile--earned' : ''}`} title={`${badge.name}: ${badge.rule} (${status})`}>
      <span className="tile__icon">
        <img src={badge.icon} alt="" width={76} height={76} loading="lazy" />
        {count !== undefined && count > 0 && <span className="tile__count">{'×'}{count}</span>}
      </span>
      <span className="tile__name">{badge.name}</span>
      <span className="tile__rule">{detail ?? badge.rule}</span>
      <span className="sr-only">{status}</span>
    </li>
  )
}
