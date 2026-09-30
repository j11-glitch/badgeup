import type { MouseEvent, ReactNode } from 'react'
import { navigate } from '../useRoute'

interface LinkProps {
  readonly to: string
  readonly className?: string
  readonly children: ReactNode
  readonly 'aria-label'?: string
}

/** An in-app link: a normal <a> (so it can be opened in a new tab) that switches page without reloading. */
export function Link({ to, className, children, 'aria-label': label }: LinkProps) {
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(to)
  }
  return (
    <a href={to} className={className} aria-label={label} onClick={onClick}>
      {children}
    </a>
  )
}
