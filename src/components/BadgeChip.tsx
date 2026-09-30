import type { CSSProperties } from 'react'
import type { Badge } from '../data/badges'

/** A badge as a coloured pill: emoji + name. */
export function BadgeChip({ badge, size = 'md' }: { badge: Badge; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`chip chip--${size}`}
      style={{ '--chip-color': badge.color } as CSSProperties}
      title={badge.description || badge.name}
    >
      <span aria-hidden="true">{badge.emoji}</span> {badge.name}
    </span>
  )
}
