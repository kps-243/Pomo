import type { GroupEventCreator } from '~/types/group'

/**
 * Libellé « X membre(s) » avec l'accord du pluriel.
 */
export function formatMembersCount(count: number): string {
  return `${count} membre${count > 1 ? 's' : ''}`
}

/**
 * Un évènement du calendrier partagé est gérable (modifiable/supprimable) par le
 * propriétaire du groupe ou par le créateur de l'évènement.
 */
export function canManageEvent(
  event: { createdBy: GroupEventCreator | null },
  currentUserId: number,
  isOwner: boolean
): boolean {
  return isOwner || event.createdBy?.id === currentUserId
}
