import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserSeeder from '#database/seeders/user_seeder'
import TaskSeeder from '#database/seeders/task_seeder'
import ToDoListSeeder from '#database/seeders/to_do_list_seeder'
import TestUserSeeder from '#database/seeders/test_user_seeder'
import WilliamUserSeeder from '#database/seeders/william_user_seeder'
import GroupSeeder from '#database/seeders/group_seeder'

export default class extends BaseSeeder {
  async run() {
    await new UserSeeder(this.client).run()
    await new ToDoListSeeder(this.client).run()
    await new TaskSeeder(this.client).run()
    await new TestUserSeeder(this.client).run()
    await new WilliamUserSeeder(this.client).run()
    await new GroupSeeder(this.client).run()
  }
}
