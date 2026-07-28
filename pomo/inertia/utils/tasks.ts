/**
 * Libellés français des statuts de tâche.
 *
 * Le statut est stocké en base sous forme de clé anglaise (`todo`, `in_progress`,
 * `done`) : cette table est la seule traduction affichée à l'utilisateur, partagée
 * par le StatusBadge des todolists et la liste des tâches du dashboard.
 */
import type { TaskStatus } from '~/types/todo'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
}

export function taskStatusLabel(status: string): string {
  return TASK_STATUS_LABELS[status as TaskStatus] ?? TASK_STATUS_LABELS.todo
}
