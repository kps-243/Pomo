/**
 * Libellé « X membre(s) » avec l'accord du pluriel.
 */
export function formatMembersCount(count: number): string {
  return `${count} membre${count > 1 ? 's' : ''}`
}
