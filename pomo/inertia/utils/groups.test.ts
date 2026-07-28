import { describe, it, expect } from 'vitest'
import { formatMembersCount } from './groups'

describe('formatMembersCount', () => {
  it('utilise le singulier pour 0 ou 1 membre', () => {
    expect(formatMembersCount(0)).toBe('0 membre')
    expect(formatMembersCount(1)).toBe('1 membre')
  })

  it('utilise le pluriel au-delà de 1 membre', () => {
    expect(formatMembersCount(2)).toBe('2 membres')
    expect(formatMembersCount(12)).toBe('12 membres')
  })
})
