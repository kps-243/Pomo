import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  static defer = true

  async run() {
    await User.createMany([
      {
        username: 'mkpassi',
        email: 'morgan@test.com',
        password: 'password',
        first_name: 'Morgan',
        last_name: 'Kpassi',
      },
      {
        username: 'john',
        email: 'john@okey.com',
        password: 'password',
        first_name: 'John',
        last_name: 'Doe',
      },
      {
        username: 'jane',
        email: 'jane@okey.com',
        password: 'password',
        first_name: 'Jane',
        last_name: 'Doe',
      },
      {
        username: 'alex',
        email: 'alex@okey.com',
        password: 'password',
        first_name: 'Alex',
        last_name: 'Smith',
      },
    ])
  }
}
