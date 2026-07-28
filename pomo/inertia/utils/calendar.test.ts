import { describe, it, expect } from 'vitest'
import {
  buildAgenda,
  calendarLabel,
  canManageItem,
  eventEndIso,
  toCalendarEntries,
  visibleTimeRange,
} from './calendar'
import type { CalendarEvent, CalendarTask } from '~/types/calendar'

const creator = { id: 7, firstName: 'Will', lastName: 'Correia' }

const makeTask = (overrides: Partial<CalendarTask> = {}): CalendarTask => ({
  id: 1,
  title: 'Relire la PR',
  description: null,
  status: 'todo',
  dueDate: '2026-07-15T10:00:00.000Z',
  listId: 3,
  listName: 'Sprint',
  groupId: null,
  groupName: null,
  createdBy: creator,
  members: [],
  ...overrides,
})

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 1,
  title: 'Réunion',
  description: null,
  startDate: '2026-07-15T08:00:00.000Z',
  endDate: '2026-07-15T09:30:00.000Z',
  location: null,
  groupId: null,
  groupName: null,
  createdBy: creator,
  ...overrides,
})

describe('eventEndIso', () => {
  it('retourne la date de fin quand elle existe', () => {
    expect(eventEndIso(makeEvent())).toBe('2026-07-15T09:30:00.000Z')
  })

  it('retombe sur une heure après le début quand la fin manque', () => {
    expect(eventEndIso(makeEvent({ endDate: null }))).toBe('2026-07-15T09:00:00.000Z')
  })
})

describe('buildAgenda', () => {
  it('trie tâches et évènements par ordre chronologique', () => {
    const items = buildAgenda(
      [
        makeTask({ id: 1, dueDate: '2026-07-15T12:00:00.000Z' }),
        makeTask({ id: 2, dueDate: '2026-07-14T08:00:00.000Z' }),
      ],
      [makeEvent({ id: 3, startDate: '2026-07-15T09:00:00.000Z' })]
    )

    expect(items.map((item) => item.key)).toEqual(['task-2', 'event-3', 'task-1'])
  })

  it('place les tâches sans échéance en fin de liste', () => {
    const items = buildAgenda(
      [makeTask({ id: 1, dueDate: null }), makeTask({ id: 2 })],
      [makeEvent({ id: 3 })]
    )

    expect(items.map((item) => item.key)).toEqual(['event-3', 'task-2', 'task-1'])
  })

  it('conserve le type de chaque élément', () => {
    const [first, second] = buildAgenda([makeTask()], [makeEvent()])

    expect(second.kind).toBe('task')
    expect(first.kind).toBe('event')
    if (first.kind === 'event') expect(first.event.title).toBe('Réunion')
  })

  it('retourne une liste vide sans tâche ni évènement', () => {
    expect(buildAgenda([], [])).toEqual([])
  })
})

describe('toCalendarEntries', () => {
  it('transforme une tâche en marqueur d’une minute portant son statut', () => {
    const [entry] = toCalendarEntries([makeTask({ status: 'in_progress' })], [])

    expect(entry.start.toISOString()).toBe('2026-07-15T10:00:00.000Z')
    expect(entry.end.getTime() - entry.start.getTime()).toBe(60000)
    expect(entry.class).toBe('task-marker in_progress')
    expect(entry.itemKey).toBe('task-1')
  })

  it('ignore les tâches sans échéance', () => {
    expect(toCalendarEntries([makeTask({ dueDate: null })], [])).toHaveLength(0)
  })

  it('donne à un évènement son créneau réel', () => {
    const [entry] = toCalendarEntries([], [makeEvent()])

    expect(entry.start.toISOString()).toBe('2026-07-15T08:00:00.000Z')
    expect(entry.end.toISOString()).toBe('2026-07-15T09:30:00.000Z')
    expect(entry.class).toBe('event-marker')
    expect(entry.itemKey).toBe('event-1')
  })

  it('distingue un évènement de groupe', () => {
    const [entry] = toCalendarEntries([], [makeEvent({ groupId: 4, groupName: 'Équipe Pomo' })])

    expect(entry.class).toBe('event-marker group')
    expect(entry.content).toBe('Équipe Pomo')
  })
})

describe('visibleTimeRange', () => {
  it('masque la nuit quand tout tient dans la journée', () => {
    // 08:00 → 09:30 heure de Paris (été)
    expect(visibleTimeRange([], [makeEvent()])).toEqual({ from: 7 * 60, to: 22 * 60 })
  })

  it('s’élargit à l’heure pleine pour un évènement matinal', () => {
    // 04:15 heure de Paris
    const event = makeEvent({
      startDate: '2026-07-15T02:15:00.000Z',
      endDate: '2026-07-15T03:00:00.000Z',
    })
    expect(visibleTimeRange([], [event]).from).toBe(4 * 60)
  })

  it('s’élargit pour une tâche tardive', () => {
    // 23:30 heure de Paris
    expect(visibleTimeRange([makeTask({ dueDate: '2026-07-15T21:30:00.000Z' })], []).to).toBe(
      24 * 60
    )
  })

  it('ne déborde jamais de la journée', () => {
    const range = visibleTimeRange(
      [makeTask({ dueDate: '2026-07-15T22:00:00.000Z' })],
      [
        makeEvent({
          startDate: '2026-07-15T00:30:00.000Z',
          endDate: '2026-07-15T01:00:00.000Z',
        }),
      ]
    )
    expect(range.from).toBeGreaterThanOrEqual(0)
    expect(range.to).toBeLessThanOrEqual(24 * 60)
  })

  it('garde la plage par défaut sans aucun élément', () => {
    expect(visibleTimeRange([], [])).toEqual({ from: 7 * 60, to: 22 * 60 })
  })
})

describe('calendarLabel', () => {
  it('nomme « Perso » le calendrier personnel', () => {
    expect(calendarLabel(null)).toBe('Perso')
  })

  it('reprend le nom du groupe pour un calendrier partagé', () => {
    expect(calendarLabel('Équipe Pomo')).toBe('Équipe Pomo')
  })
})

describe('canManageItem', () => {
  it('autorise le créateur', () => {
    expect(canManageItem(creator, 7)).toBe(true)
  })

  it('autorise le propriétaire du groupe, quel que soit le créateur', () => {
    expect(canManageItem(creator, 99, true)).toBe(true)
  })

  it('refuse un membre qui n’est ni créateur ni propriétaire', () => {
    expect(canManageItem(creator, 42, false)).toBe(false)
  })

  it('refuse quand le créateur est inconnu', () => {
    expect(canManageItem(null, 42, false)).toBe(false)
  })
})
