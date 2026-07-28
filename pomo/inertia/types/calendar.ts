import type { TaskMember, TaskStatus } from '~/types/todo'

/** Créateur d'une tâche ou d'un évènement. */
export type CalendarPerson = TaskMember

/** Une tâche telle qu'elle apparaît sur un calendrier : une échéance, pas de durée. */
export interface CalendarTask {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  dueDate: string | null
  listId: number
  listName: string
  groupId: number | null
  groupName: string | null
  createdBy: CalendarPerson | null
  members: TaskMember[]
}

/** Un évènement : une date de début et une date de fin. */
export interface CalendarEvent {
  id: number
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  location: string | null
  groupId: number | null
  groupName: string | null
  createdBy: CalendarPerson | null
}

/** Entrée de la liste chronologique du tableau de bord / du groupe. */
export type AgendaItem =
  | { kind: 'task'; key: string; date: string | null; task: CalendarTask }
  | { kind: 'event'; key: string; date: string; event: CalendarEvent }

/** Calendrier de destination lors d'une création : personnel ou d'un groupe. */
export interface CalendarTargetOption {
  label: string
  groupId: number | null
}
