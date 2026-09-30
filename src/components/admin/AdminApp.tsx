import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { useEffect, useState } from 'react'
import { watchRole, type StaffRole } from '../../data/staff'
import { auth, USING_EMULATORS } from '../../firebase'
import { useAuthUser } from '../../useAuthUser'
import { ChildrenPanel } from './ChildrenPanel'
import { StaffPanel } from './StaffPanel'
import { nb } from '../../i18n/nb'

type Tab = 'children' | 'admins'

async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    await signInWithPopup(auth, provider)
  } catch (e) {
    const code = (e as { code?: string }).code
    if (code === 'auth/popup-blocked') await signInWithRedirect(auth, provider)
    else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') throw e
  }
}

// Local test mode only: accounts created in the emulator by scripts/seed-emulator.mjs.
// They exist only in the local emulator, never in the real project.
const LOCAL_TEST_PASSWORD = 'badgeup-local-test'
const LOCAL_TEST_ACCOUNTS = [
  { label: 'superuser', email: 'superuser@badgeup.test' },
  { label: 'admin', email: 'admin@badgeup.test' },
  { label: 'stranger (no access)', email: 'stranger@badgeup.test' },
]

/** The admin side: Google sign-in, then panels according to the staff role. */
export function AdminApp() {
  const user = useAuthUser()
  const email = user?.email?.toLowerCase() ?? null
  // undefined = still checking the role of this email
  const [role, setRole] = useState<StaffRole | null | undefined>(undefined)
  const [tab, setTab] = useState<Tab>('children')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setRole(undefined)
    if (!email) return
    return watchRole(email, setRole)
  }, [email])

  if (user === undefined || (user && role === undefined)) {
    return <p className="muted">{nb.checkingAccess}</p>
  }

  if (!user) {
    return (
      <section className="card card--narrow">
        <h2>{nb.signInTitle}</h2>
        <p className="muted">{nb.signInText}</p>
        {USING_EMULATORS && (
          <div className="notice">
            <p className="notice__title">{nb.testSignIn}</p>
            <div className="quick-signin">
              {LOCAL_TEST_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="button button--small"
                  onClick={() =>
                    signInWithEmailAndPassword(auth, account.email, LOCAL_TEST_PASSWORD).catch(() =>
                      setError(nb.testSignInFailed),
                    )
                  }
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          className="button"
          onClick={() => signInWithGoogle().catch(() => setError(nb.signInFailed))}
        >
          {nb.signInWithGoogle}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
    )
  }

  if (!role) {
    return (
      <section className="card card--narrow">
        <h2>{nb.noAccessTitle}</h2>
        <p>
          <strong>{user.email}</strong> {nb.noAccessText}
        </p>
        <button type="button" className="button button--ghost" onClick={() => signOut(auth)}>
          {nb.signOut}
        </button>
      </section>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'children', label: nb.tabChildren },
    ...(role === 'superuser' ? [{ id: 'admins' as const, label: nb.tabAdmins }] : []),
  ]

  return (
    <>
      <div className="admin-bar">
        <span>
          {nb.signedInAs} <strong>{user.email}</strong> <span className="role">{nb.roles[role]}</span>
        </span>
        <button type="button" className="button button--ghost button--small" onClick={() => signOut(auth)}>
          {nb.signOut}
        </button>
      </div>

      <nav className="tabs" aria-label={nb.adminSections}>
        {tabs.map((t) => (
          <button key={t.id} type="button" aria-current={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'children' && <ChildrenPanel />}
      {tab === 'admins' && role === 'superuser' && email && <StaffPanel myEmail={email} />}
    </>
  )
}
