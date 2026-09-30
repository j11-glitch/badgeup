import { useEffect, useState, type FormEvent } from 'react'
import { createUser, deleteUser, watchUsers } from '../../data/users'
import { cleanText, LIMITS } from '../../domain/validation'
import { useLive } from '../../useLive'
import { ManualBadgesEditor } from './ManualBadgesEditor'
import { TasksEditor } from './TasksEditor'
import { nb } from '../../i18n/nb'

export function ChildrenPanel() {
  const users = useLive(watchUsers)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const cleanName = cleanText(name, LIMITS.userName)

  // Messages go away by themselves, so an old error does not linger after it is fixed.
  useEffect(() => {
    if (!error) return
    const timer = window.setTimeout(() => setError(null), 5000)
    return () => window.clearTimeout(timer)
  }, [error])

  async function add(event: FormEvent) {
    event.preventDefault()
    if (!cleanName) return
    setError(null)
    try {
      await createUser(cleanName)
      setName('')
    } catch {
      setError(nb.addChildFailed)
    }
  }

  async function remove(id: string, childName: string) {
    if (!window.confirm(nb.deleteChildConfirm(childName))) return
    try {
      await deleteUser(id)
    } catch {
      setError(nb.deleteChildFailed)
    }
  }

  return (
    <>
      <section className="card">
        <h2>{nb.newChild}</h2>
        <form className="inline-form" onSubmit={add}>
          <label htmlFor="user-name" className="sr-only">
            {nb.name}
          </label>
          <input
            id="user-name"
            value={name}
            maxLength={LIMITS.userName}
            placeholder={nb.name}
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
          />
          <button type="submit" className="button" disabled={!cleanName}>
            {nb.addChild}
          </button>
        </form>
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {users.data === null ? (
        <p className="muted">{nb.loading}</p>
      ) : users.data.length === 0 ? (
        <p className="muted">{nb.noChildren}</p>
      ) : (
        users.data.map((child) => (
          <section key={child.id} className="card">
            <div className="admin-item__head">
              <h2>{child.name}</h2>
              <button
                type="button"
                className="button button--danger button--small"
                onClick={() => void remove(child.id, child.name)}
              >
                {nb.delete}
              </button>
            </div>
            <TasksEditor child={child} onError={setError} />
            <ManualBadgesEditor child={child} onError={setError} />
          </section>
        ))
      )}
    </>
  )
}
