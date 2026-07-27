import type { GroupMessage, ReportReason } from '~/types/group'

export const MESSAGE_MAX_LENGTH = 2000

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam ou publicité',
  harassment: 'Harcèlement ou insultes',
  inappropriate: 'Contenu inapproprié',
  other: 'Autre',
}

export function formatMessageTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isSameDay) {
    return time
  }

  const day = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
  return `${day} ${time}`
}

export function canDeleteMessage(
  message: Pick<GroupMessage, 'author'>,
  currentUserId: number,
  isOwner: boolean
): boolean {
  return isOwner || message.author.id === currentUserId
}

export function canReportMessage(
  message: Pick<GroupMessage, 'author'>,
  currentUserId: number
): boolean {
  return message.author.id !== currentUserId
}
