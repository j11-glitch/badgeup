import { useEffect, useState } from 'react'

export type Route = { page: 'home' } | { page: 'child'; id: string } | { page: 'admin' }

export function parseRoute(path: string): Route {
  const clean = path.replace(/\/+$/, '')
  if (clean === '/admin') return { page: 'admin' }
  const child = /^\/child\/([A-Za-z0-9_-]+)$/.exec(clean)
  if (child) return { page: 'child', id: child[1] }
  return { page: 'home' }
}

/** Moves to another page without reloading (Firebase Hosting serves index.html for every path). */
export function navigate(path: string): void {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

/** The current page, following back/forward and navigate(). */
export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname))
  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return route
}
