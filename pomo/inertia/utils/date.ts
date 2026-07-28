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

/**
 * Heure seule d'un instant ISO : "12:30" (heure locale).
 */
export function formatTimeShort(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso)
  )
}

/**
 * Vrai si les deux instants tombent le même jour (heure locale).
 */
export function isSameDay(startIso: string, endIso: string): boolean {
  const start = new Date(startIso)
  const end = new Date(endIso)
  return (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  )
}

/**
 * Créneau d'un évènement : "15 juillet, 12:30 → 14:00" sur une même journée,
 * "15 juillet, 12:30 → 16 juillet, 09:00" sinon.
 */
export function formatDateRangeShort(startIso: string, endIso: string): string {
  const start = formatDueDateShort(startIso)
  return isSameDay(startIso, endIso)
    ? `${start} → ${formatTimeShort(endIso)}`
    : `${start} → ${formatDueDateShort(endIso)}`
}

/**
 * Nombre de minutes entre deux instants ISO (0 si l'intervalle est inversé).
 */
export function durationInMinutes(startIso: string, endIso: string): number {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime()
  return diff > 0 ? Math.round(diff / 60000) : 0
}

/**
 * Durée lisible : "45 min", "2 h", "1 h 30", "2 j 3 h".
 */
export function formatDurationShort(minutes: number): string {
  if (minutes <= 0) return '0 min'

  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const rest = minutes % 60

  if (days > 0) return hours > 0 ? `${days} j ${hours} h` : `${days} j`
  if (hours > 0) return rest > 0 ? `${hours} h ${pad(rest)}` : `${hours} h`
  return `${rest} min`
}

/**
 * Décale un instant ISO de N minutes.
 */
export function addMinutesToIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString()
}
