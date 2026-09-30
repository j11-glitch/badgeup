import { describe, expect, it } from 'vitest'
import { cleanOptionalText, cleanText, isValidColor, LIMITS, normalizeEmail, validateBadge } from './validation'

describe('text', () => {
  it('trims, collapses spaces and enforces limits', () => {
    expect(cleanText('  Gold   star ', 40)).toBe('Gold star')
    expect(cleanText('   ', 40)).toBeNull()
    expect(cleanText('x'.repeat(41), 40)).toBeNull()
    expect(cleanOptionalText('  ', 10)).toBe('')
    expect(cleanOptionalText('x'.repeat(11), 10)).toBeNull()
  })
})

describe('email', () => {
  it('normalizes to lower case and rejects invalid emails', () => {
    expect(normalizeEmail('  Admin@Example.COM ')).toBe('admin@example.com')
    expect(normalizeEmail('not-an-email')).toBeNull()
    expect(normalizeEmail('a@b')).toBeNull()
  })
})

describe('colour', () => {
  it('accepts #rrggbb only', () => {
    expect(isValidColor('#5b5bf0')).toBe(true)
    expect(isValidColor('#5B5BF0'.toLowerCase())).toBe(true)
    expect(isValidColor('blue')).toBe(false)
    expect(isValidColor('#fff')).toBe(false)
  })
})

describe('validateBadge', () => {
  it('returns cleaned values for a valid badge', () => {
    expect(validateBadge({ name: ' Star  pupil ', description: '', emoji: ' ⭐ ', color: '#FFAA00' })).toEqual({
      ok: true,
      badge: { name: 'Star pupil', description: '', emoji: '⭐', color: '#ffaa00' },
    })
  })

  it('lists every problem', () => {
    const result = validateBadge({
      name: '',
      description: 'x'.repeat(LIMITS.badgeDescription + 1),
      emoji: '',
      color: 'red',
    })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors).toHaveLength(4)
  })
})
