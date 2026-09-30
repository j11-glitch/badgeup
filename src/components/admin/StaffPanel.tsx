import { useState, type FormEvent } from 'react'
import { addAdmin, removeAdmin, watchStaff } from '../../data/staff'
import { normalizeEmail } from '../../domain/validation'
import { useLive } from '../../useLive'
import { nb } from '../../i18n/nb'

/** Superuser only: add and remove admins by Google email. */
export function StaffPanel({ myEmail }: { myEmail: string }) {
  const staff = useLive(watchStaff)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const clean = normalizeEmail(email)
  const exists = clean !== null && (staff.data ?? []).some((s) => s.email === clean)

  async function add(event: FormEvent) {
    event.preventDefault()
    if (!clean || exists) return
    setError(null)
    try {
      await addAdmin(clean, myEmail)
      setEmail('')
    } catch {
      setError(nb.addAdminFailed)
    }
  }

  async function remove(adminEmail: string) {
    if (!window.confirm(nb.removeAdminConfirm(adminEmail))) return
    try {
      await removeAdmin(adminEmail)
    } catch {
      setError(nb.removeAdminFailed)
    }
  }

  return (
    <>
      <section className="card">
        <h2>{nb.newAdmin}</h2>
        <p className="muted small">{nb.newAdminHint}</p>
        <form className="inline-form" onSubmit={add}>
          <label htmlFor="admin-email" className="sr-only">
            {nb.email}
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            placeholder="name@gmail.com"
            autoComplete="off"
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" className="button" disabled={!clean || exists}>
            {nb.addAdmin}
          </button>
        </form>
        {exists && <p className="muted small">{nb.alreadyAccess}</p>}
      </section>

      <section className="card">
        <h2>{nb.peopleWithAccess}</h2>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {staff.data === null ? (
          <p className="muted">{nb.loading}</p>
        ) : (
          <ul className="admin-list">
            {staff.data.map((member) => (
              <li key={member.email} className="admin-item">
                <span className="admin-item__text">{member.email}</span>
                <span className="role">{nb.roles[member.role]}</span>
                {member.role === 'admin' && (
                  <button
                    type="button"
                    className="button button--danger button--small"
                    onClick={() => void remove(member.email)}
                  >
                    {nb.remove}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
