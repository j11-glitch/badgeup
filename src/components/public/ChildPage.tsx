import { watchUsers, type Child } from '../../data/users'
import { LEVELS } from '../../domain/catalog'
import { useChildProgress } from '../../useChildProgress'
import { useLive } from '../../useLive'
import { useToday } from '../../useToday'
import { Avatar } from '../Avatar'
import { Link } from '../Link'
import { BadgeSections } from './BadgeSections'
import { TodayTasks } from './TodayTasks'
import { nb } from '../../i18n/nb'

/** One child's own page: tick off today's tasks and see every badge. */
export function ChildPage({ id }: { id: string }) {
  const users = useLive(watchUsers)
  const child = users.data?.find((c) => c.id === id)

  return (
    <>
      <Link to="/" className="back">
        {'←'} {nb.allChildren}
      </Link>
      {users.error ? (
        <p className="error" role="alert">
          {users.error}
        </p>
      ) : users.data === null ? (
        <p className="muted center">{nb.loading}</p>
      ) : !child ? (
        <p className="muted center">{nb.childGone}</p>
      ) : (
        <ChildDetails child={child} />
      )}
    </>
  )
}

function ChildDetails({ child }: { child: Child }) {
  const { today, now } = useToday()
  const { progress, error } = useChildProgress(child, today, now)
  const level = progress && progress.tasks.level >= 0 ? LEVELS[progress.tasks.level] : null

  return (
    <>
      <header className="hero">
        <Avatar name={child.name} size={88} />
        <div>
          <h2 className="hero__name">{child.name}</h2>
          {progress && (
            <p className="hero__stats">
              <span>
                <strong>{progress.tasks.run}</strong> {nb.dayUnit(progress.tasks.run)} {nb.inARow}
              </span>
              <span>
                <strong>{progress.earned.length}</strong> {nb.badgeUnit(progress.earned.length)}
              </span>
            </p>
          )}
        </div>
        {level && <img className="hero__level" src={level.icon} alt={nb.level(level.name)} width={84} height={84} />}
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!progress ? (
        <p className="muted center">{nb.loading}</p>
      ) : (
        <>
          <TodayTasks child={child} today={today} record={progress.days.get(today)} />
          <BadgeSections child={child} progress={progress} />
        </>
      )}
    </>
  )
}
