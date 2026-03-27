import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserSeeder from '#database/seeders/user_seeder'
import TaskSeeder from '#database/seeders/task_seeder'

export default class extends BaseSeeder {
  async run() {
    await new UserSeeder(this.client).run()
    await new TaskSeeder(this.client).run()
  }
}
