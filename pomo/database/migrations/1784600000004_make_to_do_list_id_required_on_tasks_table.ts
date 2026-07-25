import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tasks'

  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        INSERT INTO to_do_lists (name, user_id, group_id, created_at, updated_at)
        SELECT g.name, g.owner_id, g.id, now(), now()
        FROM groups g
        WHERE NOT EXISTS (SELECT 1 FROM to_do_lists t WHERE t.group_id = g.id)
      `)

      await db.rawQuery(`
        UPDATE tasks SET to_do_list_id = t.id
        FROM to_do_lists t
        WHERE t.group_id = tasks.group_id
          AND tasks.to_do_list_id IS NULL
          AND tasks.group_id IS NOT NULL
      `)

      await db.rawQuery(`
        INSERT INTO to_do_lists (name, user_id, group_id, created_at, updated_at)
        SELECT DISTINCT 'Mes tâches', tk.user_id, NULL::integer, now(), now()
        FROM tasks tk
        WHERE tk.to_do_list_id IS NULL AND tk.group_id IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM to_do_lists t
            WHERE t.user_id = tk.user_id AND t.group_id IS NULL AND t.name = 'Mes tâches'
          )
      `)
      await db.rawQuery(`
        UPDATE tasks SET to_do_list_id = t.id
        FROM to_do_lists t
        WHERE t.user_id = tasks.user_id AND t.group_id IS NULL AND t.name = 'Mes tâches'
          AND tasks.to_do_list_id IS NULL AND tasks.group_id IS NULL
      `)

      await db.rawQuery('ALTER TABLE tasks ALTER COLUMN to_do_list_id SET NOT NULL')
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery('ALTER TABLE tasks ALTER COLUMN to_do_list_id DROP NOT NULL')
    })
  }
}
