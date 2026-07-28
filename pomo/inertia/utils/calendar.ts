/**
 * Fusion des tâches et des évènements pour l'affichage calendrier.
 *
 * Fonctions pures, sans dépendance à Vue : elles alimentent le tableau de bord
 * et la page groupe, et sont couvertes par des tests unitaires.
 */

import type { AgendaItem, CalendarEvent, CalendarPerson, CalendarTask } from '~/types/calendar'

/** Durée par défaut d'un évènement dont la date de fin manque (données anciennes). */
const DEFAULT_EVENT_MINUTES = 60

/**
 * Fin effective d'un évènement : sa date de fin, ou une heure après son début.
 */
export function eventEndIso(event: Pick<CalendarEvent, 'startDate' | 'endDate'>): string {
  if (event.endDate) return event.endDate
  return new Date(new Date(event.startDate).getTime() + DEFAULT_EVENT_MINUTES * 60000).toISOString()
}

/**
 * Liste chronologique des tâches et des évènements : les éléments datés du plus
 * proche au plus lointain, puis les tâches sans échéance.
 */
export function buildAgenda(tasks: CalendarTask[], events: CalendarEvent[]): AgendaItem[] {
  const items: AgendaItem[] = [
    ...tasks.map(
      (task): AgendaItem => ({
        kind: 'task',
        key: `task-${task.id}`,
        date: task.dueDate,
        task,
      })
    ),
    ...events.map(
      (event): AgendaItem => ({
        kind: 'event',
        key: `event-${event.id}`,
        date: event.startDate,
        event,
      })
    ),
  ]

  return items.sort((a, b) => {
    if (!a.date) return b.date ? 1 : 0
    if (!b.date) return -1
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
}

/** Évènement au format attendu par vue-cal. */
export interface VueCalEntry {
  start: Date
  end: Date
  title: string
  content: string
  class: string
  itemKey: string
}

/**
 * Convertit tâches et évènements en entrées vue-cal. Une tâche est un simple
 * marqueur à son échéance (elle n'a pas de durée), un évènement occupe son
 * créneau réel.
 */
export function toCalendarEntries(tasks: CalendarTask[], events: CalendarEvent[]): VueCalEntry[] {
  const taskEntries = tasks
    .filter((task) => task.dueDate)
    .map((task) => {
      const start = new Date(task.dueDate as string)
      return {
        start,
        end: new Date(start.getTime() + 60000),
        title: task.title,
        content: task.groupName ?? '',
        class: `task-marker ${task.status}`,
        itemKey: `task-${task.id}`,
      }
    })

  const eventEntries = events.map((event) => ({
    start: new Date(event.startDate),
    end: new Date(eventEndIso(event)),
    title: event.title,
    content: event.groupName ?? '',
    class: event.groupId ? 'event-marker group' : 'event-marker',
    itemKey: `event-${event.id}`,
  }))

  return [...taskEntries, ...eventEntries]
}

/** Plage horaire affichée par défaut : la nuit est masquée tant que rien n'y est prévu. */
const DEFAULT_RANGE = { from: 7 * 60, to: 22 * 60 }

/**
 * Plage horaire à afficher sur le calendrier, en minutes depuis minuit. Part des
 * heures de journée et s'élargit à l'heure pleine pour englober tout ce qui est
 * prévu plus tôt ou plus tard : rien n'est jamais masqué.
 */
export function visibleTimeRange(
  tasks: CalendarTask[],
  events: CalendarEvent[]
): { from: number; to: number } {
  let { from, to } = DEFAULT_RANGE

  const include = (iso: string) => {
    const date = new Date(iso)
    const minutes = date.getHours() * 60 + date.getMinutes()
    from = Math.min(from, Math.floor(minutes / 60) * 60)
    to = Math.max(to, Math.ceil(minutes / 60) * 60)
  }

  for (const task of tasks) {
    if (task.dueDate) include(task.dueDate)
  }
  for (const event of events) {
    include(event.startDate)
    include(eventEndIso(event))
  }

  return { from: Math.max(from, 0), to: Math.min(to, 24 * 60) }
}

/**
 * Nom du calendrier auquel appartient un élément : « Perso » ou le nom du groupe.
 */
export function calendarLabel(groupName: string | null): string {
  return groupName ?? 'Perso'
}

/**
 * Un élément est gérable (modifiable/supprimable) par son créateur, ou par le
 * propriétaire du groupe pour un élément partagé.
 */
export function canManageItem(
  createdBy: CalendarPerson | null,
  currentUserId: number,
  isGroupOwner = false
): boolean {
  return isGroupOwner || createdBy?.id === currentUserId
}
