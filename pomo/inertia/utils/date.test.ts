import { describe, it, expect } from 'vitest'
import {
  buildTimeOptions,
  snapToHalfHour,
  toIsoInstant,
  formatDueDateShort,
  formatDueDateLong,
} from './date'

// ⚠️ Ces tests sont déterministes car exécutés en TZ=Europe/Paris
// (voir le script npm "test:unit"). Les fonctions de format/conversion
// dépendent du fuseau local, on le fixe donc explicitement.

describe('buildTimeOptions', () => {
  const options = buildTimeOptions()

  it('génère 48 créneaux (toutes les 30 minutes sur 24 h)', () => {
    expect(options).toHaveLength(48)
  })

  it('commence à 00:00 et finit à 23:30', () => {
    expect(options[0]).toBe('00:00')
    expect(options.at(-1)).toBe('23:30')
  })

  it('contient les demi-heures et pas les quarts d’heure', () => {
    expect(options).toContain('12:00')
    expect(options).toContain('12:30')
    expect(options).not.toContain('12:15')
  })

  it('formate toujours en HH:mm avec minutes 00 ou 30', () => {
    for (const option of options) expect(option).toMatch(/^\d{2}:(00|30)$/)
  })
})

describe('snapToHalfHour', () => {
  it('arrondit vers le bas avant la 15e minute', () => {
    expect(snapToHalfHour(12, 14)).toBe('12:00')
  })

  it('arrondit vers le haut à partir de la 15e minute', () => {
    expect(snapToHalfHour(12, 15)).toBe('12:30')
  })

  it('arrondit à l’heure suivante après la 45e minute', () => {
    expect(snapToHalfHour(12, 45)).toBe('13:00')
  })

  it('laisse inchangées les valeurs déjà alignées', () => {
    expect(snapToHalfHour(9, 30)).toBe('09:30')
    expect(snapToHalfHour(0, 0)).toBe('00:00')
  })

  it('borne à 23:30 pour ne pas déborder sur le jour suivant', () => {
    expect(snapToHalfHour(23, 50)).toBe('23:30')
  })
})

describe('toIsoInstant', () => {
  it('produit un instant absolu en UTC (suffixe Z)', () => {
    expect(toIsoInstant(2026, 7, 15, 12, 30)).toMatch(/Z$/)
  })

  it('convertit une heure d’été (Europe/Paris = UTC+2) en UTC', () => {
    // 12:30 à Paris en juillet (CEST) = 10:30 UTC
    expect(toIsoInstant(2026, 7, 15, 12, 30)).toBe('2026-07-15T10:30:00.000Z')
  })

  it('gère l’heure d’hiver (Europe/Paris = UTC+1)', () => {
    // 12:30 à Paris en janvier (CET) = 11:30 UTC
    expect(toIsoInstant(2026, 1, 15, 12, 30)).toBe('2026-01-15T11:30:00.000Z')
  })

  it('correspond à la conversion Date native (indépendant du fuseau)', () => {
    expect(toIsoInstant(2026, 7, 15, 8, 0)).toBe(new Date(2026, 6, 15, 8, 0).toISOString())
  })
})

describe('formatDueDateShort', () => {
  it('formate une échéance en "j mois, HH:mm" à l’heure locale', () => {
    // 10:30 UTC = 12:30 à Paris (été)
    expect(formatDueDateShort('2026-07-15T10:30:00.000Z')).toBe('15 juillet, 12:30')
  })
})

describe('formatDueDateLong', () => {
  it('formate une date complète en français', () => {
    const formatted = formatDueDateLong(new Date(2026, 6, 15, 12, 30))
    expect(formatted).toContain('15 juillet 2026')
    expect(formatted).toContain('12:30')
  })
})
