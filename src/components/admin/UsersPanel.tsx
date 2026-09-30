import { useState, type FormEvent } from 'react'
import { watchBadges } from '../../data/badges'
import { createUser, deleteUser, setBadge, watchUsers } from '../../data/users'
import { cleanText, LIMITS } from '../../domain/validation'
import { useLive } from '../../useLive'

export function UsersPanel() {
  const users = useLive(watchUsers)
  const badges = useLive(watchBadges)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const cleanName = cleanText(name, LIMITS.userName)

  async function add(event: FormEvent) {
    event.preventDefault()
    if (!cleanName) return
    setError(null)
    try {
      await createUser(cleanName)
      setName('')
    } catch {
      setError('Could not add the user.')
    }
  }

  async function remove(id: string, userName: string) {
    if (!window.confirm(`Delete ${userName} and all their badges?`)) return
    try {
      await deleteUser(id)
    } catch {
      setError('Could not delete the user.')
    }
  }

  async function toggle(userId: string, badgeId: string, awarded: boolean) {
    try {
      await setBadge(userId, badgeId, awarded)
    } catch {
      setError('Could not update the badge.')
    }
  }

  return (
    <>
      <section className="card">
        <h2>New user</h2>
        <form className="inline-form" onSubmit={add}>
          <label htmlFor="user-name" className="sr-only">
            Name
          </label>
          <input
            id="user-name"
            value={name}
            maxLength={LIMITS.userName}
            placeholder="Name"
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
          />
          <button type="submit" className="button" disabled={!cleanName}>
            Add user
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Users</h2>
        <p className="muted small">Tap a badge to give it to a user, tap again to take it away.</p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {users.data === null || badges.data === null ? (
          <p className="muted">Loading...</p>
        ) : users.data.length === 0 ? (
          <p className="muted">No users yet.</p>
        ) : (
          <ul className="admin-list">
            {users.data.map((user) => (
              <li key={user.id} className="admin-item admin-item--user">
                <div className="admin-item__head">
                  <strong>{user.name}</strong>
                  <button
                    type="button"
                    className="button button--danger button--small"
                    onClick={() => void remove(user.id, user.name)}
                  >
                    Delete
                  </button>
                </div>
                <div className="award-row" role="group" aria-label={`Badges for ${user.name}`}>
                  {badges.data!.length === 0 && <span className="muted small">Create badges first.</span>}
                  {badges.data!.map((badge) => {
                    const awarded = user.badgeIds.includes(badge.id)
                    return (
                      <button
                        key={badge.id}
                        type="button"
                        className={`award${awarded ? ' award--on' : ''}`}
                        aria-pressed={awarded}
                        style={{ '--chip-color': badge.color } as React.CSSProperties}
                        onClick={() => void toggle(user.id, badge.id, !awarded)}
                      >
                        <span aria-hidden="true">{badge.emoji}</span> {badge.name}
                      </button>
                    )
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
