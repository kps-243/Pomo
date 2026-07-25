import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import ToDoList from '#models/to_do_list'
import User from '#models/user'
import Group from '#models/group'

export default class Task extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare status: 'todo' | 'in_progress' | 'done'

  @column.dateTime()
  declare due_date: DateTime | null

  @column()
  declare duration: number | null

  @column()
  declare position: number

  @column()
  declare userId: number

  @column()
  declare toDoListId: number

  @column()
  declare groupId: number | null

  @belongsTo(() => ToDoList)
  declare toDoList: BelongsTo<typeof ToDoList>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Group)
  declare group: BelongsTo<typeof Group>

  @manyToMany(() => User, {
    pivotTable: 'task_members',
    pivotTimestamps: true,
  })
  declare members: ManyToMany<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
