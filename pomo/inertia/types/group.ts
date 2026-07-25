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
}

export interface GroupEventCreator {
  id: number
  firstName: string
  lastName: string
}

export interface GroupEvent {
  id: number
  title: string
  description: string | null
  dueDate: string | null
  duration: number
  createdBy: GroupEventCreator | null
}
