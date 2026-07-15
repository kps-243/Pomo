export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Assignee {
  firstName: string
  lastName: string
}

export interface TaskItem {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  dueDate: string | null
  assignees: Assignee[]
}

export interface ToDoListItem {
  id: number
  name: string
  tasks: TaskItem[]
}
