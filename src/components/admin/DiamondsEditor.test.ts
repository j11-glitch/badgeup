import { describe, expect, it } from 'vitest'
import { parseDiamonds } from './DiamondsEditor'

describe('parseDiamonds', () => {
  it('accepts whole numbers from 0 to 999', () => {
    expect(parseDiamonds('0')).toBe(0)
    expect(parseDiamonds(' 12 ')).toBe(12)
    expect(parseDiamonds('999')).toBe(999)
  })

  it('rejects everything else', () => {
    for (const text of ['', '-1', '1000', '1.5', '1,5', 'abc', '2e2']) expect(parseDiamonds(text)).toBeNull()
  })
})
