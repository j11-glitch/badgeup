import { watchUsers } from '../../data/users'
import { useLive } from '../../useLive'
import { useToday } from '../../useToday'
import { ChildSummary } from './ChildSummary'
import { nb } from '../../i18n/nb'

/** The public start page: every child with an overview of their badges. */
export function Overview() {
  const users = useLive(watchUsers)
  const { today, now } = useToday()

  return (
    <>
      <p className="tagline">{nb.tagline}</p>
      {users.error ? (
        <p className="error" role="alert">
          {users.error}
        </p>
      ) : users.data === null ? (
        <p className="muted center">{nb.loading}</p>
      ) : users.data.length === 0 ? (
        <p className="muted center">{nb.noChildren}</p>
      ) : (
        <ul className="summaries">
          {users.data.map((child) => (
            <ChildSummary key={child.id} child={child} today={today} now={now} />
          ))}
        </ul>
      )}
    </>
  )
}
