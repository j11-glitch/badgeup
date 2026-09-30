import { AdminApp } from './components/admin/AdminApp'
import { PublicView } from './components/public/PublicView'
import { USING_EMULATORS } from './firebase'

// Set by the GitHub Actions deploy; local builds show "local".
const COMMIT = (import.meta.env.VITE_COMMIT_SHA as string | undefined)?.slice(0, 7) ?? 'local'

export default function App() {
  const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin'

  return (
    <main className="page">
      <header className="page__header">
        <a className="brand" href="/">
          BadgeUp
        </a>
        <h1>{isAdmin ? 'Admin' : 'Badges'}</h1>
        {USING_EMULATORS && <p className="notice">Local test mode: using emulators, not the real database.</p>}
      </header>

      {isAdmin ? <AdminApp /> : <PublicView />}

      <footer className="build">
        {isAdmin ? <a href="/">Public page</a> : <a href="/admin">Admin</a>} {'\u00b7'} build <code>{COMMIT}</code>
      </footer>
    </main>
  )
}
