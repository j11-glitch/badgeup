import type { Child } from '../../data/users'
import { TASK_BADGES } from '../../domain/catalog'
import type { DayKey } from '../../domain/progress'
import { useChildProgress } from '../../useChildProgress'
import { Avatar } from '../Avatar'
import { Link } from '../Link'
import { nb } from '../../i18n/nb'

const SHOWN = 8

/** A child on the start page: name, streak, today's progress and the badges they have. */
export function ChildSummary({ child, today, now }: { child: Child; today: DayKey; now: Date }) {
  const { progress, error } = useChildProgress(child, today, now)
  const done = progress?.days.get(today)?.done.filter((id) => child.tasks.some((t) => t.id === id)).length ?? 0
  const total = child.tasks.length
  const earned = progress?.earned ?? []

  return (
    <li>
      <Link to={`/child/${child.id}`} className="summary" aria-label={nb.open(child.name)}>
        <div className="summary__head">
          <Avatar name={child.name} />
          <div className="summary__who">
            <span className="summary__name">{child.name}</span>
            <span className="summary__run">
              <img src={TASK_BADGES.streak.icon} alt="" width={20} height={20} />
              {progress ? nb.daysInARow(progress.tasks.run) : '...'}
            </span>
          </div>
          <span className="summary__count" aria-label={nb.badgeCount(earned.length)}>
            <strong>{earned.length}</strong>
            <span>{nb.badgesLabel}</span>
          </span>
        </div>

        {total > 0 && (
          <div className="meter" aria-label={nb.todayProgressLabel(done, total)}>
            <span className="meter__bar" style={{ width: `${(done / total) * 100}%` }} />
            <span className="meter__label">
              {done === total ? nb.allDoneToday : nb.todayProgress(done, total)}
            </span>
          </div>
        )}

        {error ? (
          <span className="error small">{error}</span>
        ) : earned.length === 0 ? (
          <span className="muted small">{nb.noBadgesYet}</span>
        ) : (
          <span className="summary__badges">
            {earned.slice(0, SHOWN).map(({ id, badge, count }) => (
              <span key={id} className="mini" title={badge.name}>
                <img src={badge.icon} alt={badge.name} width={40} height={40} />
                {count !== undefined && count > 1 && <span className="mini__count">{count}</span>}
              </span>
            ))}
            {earned.length > SHOWN && <span className="mini mini--more">+{earned.length - SHOWN}</span>}
          </span>
        )}
      </Link>
    </li>
  )
}
