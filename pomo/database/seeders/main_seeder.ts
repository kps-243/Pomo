import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserSeeder from '#database/seeders/user_seeder'
import TaskSeeder from '#database/seeders/task_seeder'
import ToDoListSeeder from '#database/seeders/to_do_list_seeder'

export default class extends BaseSeeder {
  async run() {
    await new UserSeeder(this.client).run()
    await new TaskSeeder(this.client).run()
    await new ToDoListSeeder(this.client).run()
  }
}
