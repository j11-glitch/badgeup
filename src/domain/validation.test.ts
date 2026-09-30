import { describe, expect, it } from 'vitest'
import { cleanText, normalizeEmail } from './validation'

describe('text', () => {
  it('trims, collapses spaces and enforces limits', () => {
    expect(cleanText('  Les   bok ', 40)).toBe('Les bok')
    expect(cleanText('   ', 40)).toBeNull()
    expect(cleanText('x'.repeat(41), 40)).toBeNull()
  })
})

describe('email', () => {
  it('normalizes to lower case and rejects invalid emails', () => {
    expect(normalizeEmail('  Admin@Example.COM ')).toBe('admin@example.com')
    expect(normalizeEmail('not-an-email')).toBeNull()
    expect(normalizeEmail('a@b')).toBeNull()
  })
})
