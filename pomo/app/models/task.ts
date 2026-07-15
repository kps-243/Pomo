import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ToDoList from '#models/to_do_list'
import User from '#models/user'

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
  declare userId: number

  @column()
  declare toDoListId: number | null

  @belongsTo(() => ToDoList)
  declare toDoList: BelongsTo<typeof ToDoList>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
