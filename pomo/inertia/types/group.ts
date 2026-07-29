export type GroupRole = 'owner' | 'member'

export interface GroupSummary {
  id: number
  name: string
  description: string | null
  role: GroupRole
  membersCount: number
}

export interface GroupDetail {
  id: number
  name: string
  description: string | null
  ownerId: number
}

export interface GroupMember {
  id: number
  firstName: string
  lastName: string
  email: string
  role: GroupRole
  avatarUrl: string | null
}

export interface GroupMessageAuthor {
  id: number
  firstName: string
  lastName: string
}

export interface GroupMessage {
  id: number
  content: string
  createdAt: string
  author: GroupMessageAuthor
}

export interface GroupChatBootstrap {
  token: string
  path: string
  messages: GroupMessage[]
}

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'

export interface GroupMessageReport {
  id: number
  reason: ReportReason
  comment: string | null
  status: ReportStatus
  createdAt: string
  reporter: GroupMessageAuthor
  message: {
    id: number
    content: string
    deleted: boolean
    author: GroupMessageAuthor
  }
}
