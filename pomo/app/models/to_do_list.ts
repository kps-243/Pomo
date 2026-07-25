import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import Task from '#models/task'
import Group from '#models/group'

export default class ToDoList extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare userId: number

  @column()
  declare groupId: number | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Task)
  declare tasks: HasMany<typeof Task>

  @belongsTo(() => Group)
  declare group: BelongsTo<typeof Group>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
