import { useState } from 'react'
import { createBadge, deleteBadge, updateBadge, watchBadges } from '../../data/badges'
import { watchUsers } from '../../data/users'
import { useLive } from '../../useLive'
import { BadgeChip } from '../BadgeChip'
import { BadgeForm } from './BadgeForm'

export function BadgesPanel() {
  const badges = useLive(watchBadges)
  const users = useLive(watchUsers)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function remove(id: string, name: string) {
    const holders = (users.data ?? []).filter((u) => u.badgeIds.includes(id)).map((u) => u.id)
    const note = holders.length ? ` It will also be removed from ${holders.length} user(s).` : ''
    if (!window.confirm(`Delete the badge "${name}"?${note}`)) return
    try {
      await deleteBadge(id, holders)
    } catch {
      setError('Could not delete the badge.')
    }
  }

  return (
    <>
      <section className="card">
        <h2>New badge</h2>
        <BadgeForm submitLabel="Add badge" onSave={createBadge} />
      </section>

      <section className="card">
        <h2>Badges</h2>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {badges.data === null ? (
          <p className="muted">Loading...</p>
        ) : badges.data.length === 0 ? (
          <p className="muted">No badges yet.</p>
        ) : (
          <ul className="admin-list">
            {badges.data.map((badge) =>
              editing === badge.id ? (
                <li key={badge.id} className="admin-item admin-item--editing">
                  <BadgeForm
                    initial={badge}
                    submitLabel="Save"
                    onSave={async (values) => {
                      await updateBadge(badge.id, values)
                      setEditing(null)
                    }}
                    onCancel={() => setEditing(null)}
                  />
                </li>
              ) : (
                <li key={badge.id} className="admin-item">
                  <BadgeChip badge={badge} />
                  <span className="admin-item__text muted small">{badge.description}</span>
                  <span className="admin-item__actions">
                    <button type="button" className="button button--ghost button--small" onClick={() => setEditing(badge.id)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="button button--danger button--small"
                      onClick={() => void remove(badge.id, badge.name)}
                    >
                      Delete
                    </button>
                  </span>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </>
  )
}
