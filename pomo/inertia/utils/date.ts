/**
 * Utilitaires de date/heure pour la gestion des échéances (due_date).
 *
 * Fonctions pures, sans dépendance à Vue : elles sont utilisées par les
 * composants (DateBadge, CalendarPicker) et couvertes par des tests unitaires.
 */

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Génère les créneaux horaires par pas de 30 minutes : ["00:00", "00:30", … "23:30"].
 */
export function buildTimeOptions(): string[] {
  return Array.from({ length: 48 }, (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`)
}

/**
 * Arrondit une heure quelconque au créneau de 30 minutes le plus proche,
 * borné à 23:30. Ex. (12, 15) -> "12:30", (12, 14) -> "12:00".
 */
export function snapToHalfHour(hours: number, minutes: number): string {
  const snapped = Math.min(Math.round((hours * 60 + minutes) / 30) * 30, 23 * 60 + 30)
  return `${pad(Math.floor(snapped / 60))}:${pad(snapped % 60)}`
}

/**
 * Convertit des composants d'heure locale (mois en base 1) en instant absolu ISO (UTC).
 * On envoie toujours un instant absolu au serveur pour éviter tout décalage de fuseau.
 * Ex. (2026, 7, 15, 12, 30) en Europe/Paris -> "2026-07-15T10:30:00.000Z".
 */
export function toIsoInstant(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number
): string {
  return new Date(year, month - 1, day, hours, minutes).toISOString()
}

/**
 * Format court d'une échéance pour le badge : "15 juillet, 12:30" (heure locale).
 */
export function formatDueDateShort(iso: string): string {
  const date = new Date(iso)
  const day = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(date)
  const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
  return `${day}, ${time}`
}

/**
 * Format long d'une date pour le récapitulatif : "mercredi 15 juillet 2026 à 12:30".
 */
export function formatDueDateLong(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
