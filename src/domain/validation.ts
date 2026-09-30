// Limits shared by the forms and firestore.rules (keep both in sync).
export const LIMITS = {
  badgeName: 40,
  badgeDescription: 200,
  badgeEmoji: 8,
  userName: 60,
  badgesPerUser: 100,
} as const

export const DEFAULT_BADGE_COLOR = '#5b5bf0'
const COLOR = /^#[0-9a-f]{6}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Trims and collapses spaces; null when empty or longer than `max`. */
export function cleanText(input: string, max: number): string | null {
  const text = input.trim().replace(/\s+/g, ' ')
  return text.length >= 1 && text.length <= max ? text : null
}

/** Like cleanText, but an empty value is allowed (returns ""). */
export function cleanOptionalText(input: string, max: number): string | null {
  const text = input.trim().replace(/\s+/g, ' ')
  return text.length <= max ? text : null
}

export function isValidColor(color: string): boolean {
  return COLOR.test(color)
}

/** Emails are stored and compared in lower case (they are the key of an admin). */
export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase()
  return EMAIL.test(email) ? email : null
}

export interface BadgeInput {
  readonly name: string
  readonly description: string
  readonly emoji: string
  readonly color: string
}

/** Validated badge fields, or a list of problems for the form. */
export function validateBadge(input: BadgeInput): { ok: true; badge: BadgeInput } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const name = cleanText(input.name, LIMITS.badgeName)
  const description = cleanOptionalText(input.description, LIMITS.badgeDescription)
  const emoji = cleanText(input.emoji, LIMITS.badgeEmoji)
  const color = input.color.toLowerCase()
  if (!name) errors.push(`Name is required (max ${LIMITS.badgeName} characters).`)
  if (description === null) errors.push(`Description can be at most ${LIMITS.badgeDescription} characters.`)
  if (!emoji) errors.push('Pick an emoji (or a short symbol).')
  if (!isValidColor(color)) errors.push('Colour must look like #5b5bf0.')
  if (errors.length > 0 || !name || description === null || !emoji) return { ok: false, errors }
  return { ok: true, badge: { name, description, emoji, color } }
}
