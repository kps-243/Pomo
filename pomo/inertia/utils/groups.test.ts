import { describe, it, expect } from 'vitest'
import { formatMembersCount, canManageEvent } from './groups'

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

describe('canManageEvent', () => {
  const creator = { id: 7, firstName: 'Will', lastName: 'Correia' }

  it('autorise le propriétaire du groupe, quel que soit le créateur', () => {
    const event = { createdBy: creator }
    expect(canManageEvent(event, 99, true)).toBe(true)
  })

  it("autorise le créateur de l'évènement même s'il n'est pas propriétaire", () => {
    const event = { createdBy: creator }
    expect(canManageEvent(event, 7, false)).toBe(true)
  })

  it("refuse un membre qui n'est ni propriétaire ni créateur", () => {
    const event = { createdBy: creator }
    expect(canManageEvent(event, 42, false)).toBe(false)
  })

  it('refuse quand il n’y a pas de créateur et que l’utilisateur n’est pas propriétaire', () => {
    const event = { createdBy: null }
    expect(canManageEvent(event, 42, false)).toBe(false)
  })
})
