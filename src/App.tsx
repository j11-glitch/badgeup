import { AdminApp } from './components/admin/AdminApp'
import { Link } from './components/Link'
import { ChildPage } from './components/public/ChildPage'
import { Overview } from './components/public/Overview'
import { LOGO } from './domain/catalog'
import { USING_EMULATORS } from './firebase'
import { useRoute } from './useRoute'
import { nb } from './i18n/nb'

// Set by the GitHub Actions deploy; local builds show "local".
const COMMIT = (import.meta.env.VITE_COMMIT_SHA as string | undefined)?.slice(0, 7) ?? 'local'

export default function App() {
  const route = useRoute()

  return (
    <main className={`page${route.page === 'admin' ? ' page--admin' : ''}`}>
      <header className="masthead">
        <Link to="/" className="brand" aria-label={nb.home}>
          <img src={LOGO} alt="" width={64} height={64} />
          <span>
            Badge<em>Up</em>
          </span>
        </Link>
        {route.page === 'admin' && <span className="masthead__section">{nb.adminLink}</span>}
      </header>
      {USING_EMULATORS && <p className="notice">{nb.localMode}</p>}

      {route.page === 'admin' ? <AdminApp /> : route.page === 'child' ? <ChildPage id={route.id} /> : <Overview />}

      <footer className="build">
        {route.page === 'admin' ? <Link to="/">{nb.publicPage}</Link> : <Link to="/admin">{nb.adminLink}</Link>} {'\u00b7'} {nb.build}{' '}
        <code>{COMMIT}</code>
      </footer>
    </main>
  )
}
