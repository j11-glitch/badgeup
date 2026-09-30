// Set by the GitHub Actions deploy; local builds show "local".
const COMMIT = (import.meta.env.VITE_COMMIT_SHA as string | undefined)?.slice(0, 7) ?? 'local'

export default function App() {
  return (
    <main className="hello">
      <p className="hello__brand">BadgeUp</p>
      <h1>Hello, world!</h1>
      <p className="hello__build">
        Deployed automatically from GitHub · build <code>{COMMIT}</code>
      </p>
    </main>
  )
}
