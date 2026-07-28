import { describe, expect, it } from 'vitest'
import { canDeleteMessage, canReportMessage, formatMessageTime } from './chat'

const author = (id: number) => ({ author: { id, firstName: 'A', lastName: 'B' } })

describe('formatMessageTime', () => {
  it("n'affiche que l'heure pour un message du jour", () => {
    const now = new Date('2026-07-27T18:00:00')
    expect(formatMessageTime(new Date('2026-07-27T09:05:00').toISOString(), now)).toBe('09:05')
  })

  it('préfixe la date pour un message plus ancien', () => {
    const now = new Date('2026-07-27T18:00:00')
    expect(formatMessageTime(new Date('2026-07-25T09:05:00').toISOString(), now)).toBe(
      '25 juil. 09:05'
    )
  })
})

describe('canDeleteMessage', () => {
  it("autorise l'auteur du message", () => {
    expect(canDeleteMessage(author(7), 7, false)).toBe(true)
  })

  it('autorise le propriétaire du groupe sur les messages des autres', () => {
    expect(canDeleteMessage(author(7), 99, true)).toBe(true)
  })

  it('refuse un membre sur le message de quelqu’un d’autre', () => {
    expect(canDeleteMessage(author(7), 99, false)).toBe(false)
  })
})

describe('canReportMessage', () => {
  it('refuse le signalement de son propre message', () => {
    expect(canReportMessage(author(7), 7)).toBe(false)
  })

  it('autorise le signalement du message d’un autre', () => {
    expect(canReportMessage(author(7), 99)).toBe(true)
  })
})
