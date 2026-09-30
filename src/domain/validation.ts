// Limits shared by the forms and firestore.rules (keep both in sync).
export const LIMITS = {
  userName: 60,
  taskTitle: 40,
  tasksPerUser: 12,
  diamonds: 999,
} as const

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Trims and collapses spaces; null when empty or longer than `max`. */
export function cleanText(input: string, max: number): string | null {
  const text = input.trim().replace(/\s+/g, ' ')
  return text.length >= 1 && text.length <= max ? text : null
}

/** Emails are stored and compared in lower case (they are the key of an admin). */
export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase()
  return EMAIL.test(email) ? email : null
}
