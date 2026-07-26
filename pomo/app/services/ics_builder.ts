import { DateTime } from 'luxon'

export interface IcsEvent {
  uid: string
  title: string
  description?: string | null
  start: DateTime
  end: DateTime
}

/**
 * Échappe le texte selon RFC 5545 (les champs TEXT n'autorisent pas
 * les virgules, points-virgules ou retours à la ligne bruts).
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Découpe les lignes de plus de 75 caractères avec une continuation
 * indentée, comme l'exige RFC 5545, pour rester compatible avec tous
 * les clients (Google, Outlook, Apple).
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  let rest = line
  chunks.push(rest.slice(0, 75))
  rest = rest.slice(75)
  while (rest.length > 0) {
    chunks.push(' ' + rest.slice(0, 74))
    rest = rest.slice(74)
  }
  return chunks.join('\r\n')
}

function formatDateUtc(date: DateTime): string {
  return date.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'")
}

/**
 * Construit un calendrier iCal (.ics) valide à partir d'une liste
 * d'évènements, pour abonnement dans Google Calendar, Outlook ou
 * Apple Calendar.
 */
export function buildIcsCalendar(calendarName: string, events: IcsEvent[]): string {
  const now = formatDateUtc(DateTime.utc())

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pomo//Calendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldLine(`X-WR-CALNAME:${escapeText(calendarName)}`),
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ]

  for (const event of events) {
    lines.push('BEGIN:VEVENT')
    lines.push(foldLine(`UID:${event.uid}@pomo.local`))
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART:${formatDateUtc(event.start)}`)
    lines.push(`DTEND:${formatDateUtc(event.end)}`)
    lines.push(foldLine(`SUMMARY:${escapeText(event.title)}`))
    if (event.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeText(event.description)}`))
    }
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return lines.join('\r\n') + '\r\n'
}
