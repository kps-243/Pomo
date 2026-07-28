export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Assignee {
  firstName: string
  lastName: string
}

// Un membre de la tâche : un utilisateur qui la réalise.
export interface TaskMember extends Assignee {
  id: number
}

export interface TaskItem {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  dueDate: string | null
  createdBy: TaskMember | null
  members: TaskMember[]
}

export interface ToDoListItem {
  id: number
  name: string
  groupId: number | null
  tasks: TaskItem[]
}
