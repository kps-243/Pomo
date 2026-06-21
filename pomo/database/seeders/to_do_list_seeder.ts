import ToDoList from '#models/to_do_list'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await ToDoList.createMany([
      { name: 'Courses de la semaine', userId: 1 },
      { name: 'Projet Pomo', userId: 1 },
      { name: 'Aller à On Air', userId: 2 },
      { name: 'Réaliser le projet de Symfony', userId: 3 },
      { name: 'Tractions avec Yasmine', userId: 4 },
    ])
  }
}
