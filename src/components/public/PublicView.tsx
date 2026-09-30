import { watchBadges } from '../../data/badges'
import { watchUsers } from '../../data/users'
import { useLive } from '../../useLive'
import { BadgeChip } from '../BadgeChip'

/** What everyone sees, without logging in: every user and their badges, plus all badges. */
export function PublicView() {
  const badges = useLive(watchBadges)
  const users = useLive(watchUsers)
  const byId = new Map((badges.data ?? []).map((b) => [b.id, b]))

  return (
    <>
      <section className="card">
        <h2>Badges earned</h2>
        {users.error || badges.error ? (
          <p className="error" role="alert">
            {users.error ?? badges.error}
          </p>
        ) : users.data === null || badges.data === null ? (
          <p className="muted">Loading...</p>
        ) : users.data.length === 0 ? (
          <p className="muted">Nobody here yet.</p>
        ) : (
          <ul className="people">
            {users.data.map((user) => {
              const earned = user.badgeIds.map((id) => byId.get(id)).filter((b) => b !== undefined)
              return (
                <li key={user.id} className="person">
                  <span className="person__name">{user.name}</span>
                  <span className="person__badges">
                    {earned.length === 0 ? (
                      <span className="muted small">No badges yet</span>
                    ) : (
                      earned.map((badge) => <BadgeChip key={badge.id} badge={badge} size="sm" />)
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>All badges</h2>
        {badges.data && badges.data.length > 0 ? (
          <ul className="badge-list">
            {badges.data.map((badge) => (
              <li key={badge.id}>
                <BadgeChip badge={badge} />
                {badge.description && <span className="muted small">{badge.description}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{badges.data ? 'No badges yet.' : 'Loading...'}</p>
        )}
      </section>
    </>
  )
}
