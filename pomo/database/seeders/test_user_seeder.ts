import User from '#models/user'
import ToDoList from '#models/to_do_list'
import Task from '#models/task'
import Event from '#models/event'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const user = await User.create({
      username: 'Testinho',
      email: 'test@test.com',
      password: 'TESTtest00!!',
      first_name: 'Testeur',
      last_name: 'Test',
    })

    const [sprint, revisions, perso] = await ToDoList.createMany([
      { name: 'Sprint Pomo', userId: user.id },
      { name: 'Révisions M1', userId: user.id },
      { name: 'Perso', userId: user.id },
    ])

    const jour = DateTime.now().startOf('day')

    await Task.createMany([
      {
        title: 'Daily standup',
        description: "Point rapide avec l'équipe",
        status: 'done',
        due_date: jour.plus({ hours: 9, minutes: 30 }),
        userId: user.id,
        position: 0,
        toDoListId: sprint.id,
      },
      {
        title: 'Intégrer le burger menu',
        description: 'Navigation mobile du dashboard',
        status: 'in_progress',
        due_date: jour.plus({ hours: 10 }),
        userId: user.id,
        position: 1,
        toDoListId: sprint.id,
      },
      {
        title: 'Revue de code',
        description: 'Relire la PR du calendrier',
        status: 'todo',
        due_date: jour.plus({ hours: 14 }),
        userId: user.id,
        position: 2,
        toDoListId: sprint.id,
      },
      {
        title: 'Rédiger la doc API',
        description: 'Documenter les routes /tasks',
        status: 'todo',
        due_date: jour.plus({ days: 1, hours: 11 }),
        userId: user.id,
        position: 3,
        toDoListId: sprint.id,
      },
      {
        title: 'TP Docker',
        description: 'Compose multi-services',
        status: 'done',
        due_date: jour.minus({ days: 1 }).plus({ hours: 14 }),
        userId: user.id,
        position: 0,
        toDoListId: revisions.id,
      },
      {
        title: 'Réviser les WebSockets',
        description: 'Chapitres 4 à 6',
        status: 'todo',
        due_date: jour.plus({ days: 1, hours: 16 }),
        userId: user.id,
        position: 1,
        toDoListId: revisions.id,
      },
      {
        title: 'Préparer la soutenance',
        description: 'Slides + démo du projet annuel',
        status: 'todo',
        due_date: jour.plus({ days: 2, hours: 10 }),
        userId: user.id,
        position: 2,
        toDoListId: revisions.id,
      },
      {
        title: 'Séance natation',
        description: '1 km crawl',
        status: 'done',
        due_date: jour.minus({ days: 1 }).plus({ hours: 18, minutes: 30 }),
        userId: user.id,
        position: 0,
        toDoListId: perso.id,
      },
      {
        title: 'Courses de la semaine',
        description: 'Marché puis supermarché',
        status: 'todo',
        due_date: jour.plus({ hours: 18 }),
        userId: user.id,
        position: 1,
        toDoListId: perso.id,
      },
      {
        title: 'Appeler le dentiste',
        description: 'Prendre rendez-vous',
        status: 'todo',
        due_date: jour.plus({ days: 2, hours: 9 }),
        userId: user.id,
        position: 2,
        toDoListId: perso.id,
      },
    ])

    await Event.createMany([
      {
        title: 'Cours de M1',
        description: 'Amphi projet annuel',
        start_date: jour.plus({ hours: 13 }),
        end_date: jour.plus({ hours: 16 }),
        location: 'Campus - Amphi B',
        userId: user.id,
        groupId: null,
      },
      {
        title: 'Déjeuner avec Morgan',
        description: null,
        start_date: jour.plus({ days: 1, hours: 12, minutes: 30 }),
        end_date: jour.plus({ days: 1, hours: 14 }),
        location: 'Le Petit Bistrot',
        userId: user.id,
        groupId: null,
      },
      {
        title: 'Séance de sport',
        description: 'Renforcement musculaire',
        start_date: jour.plus({ days: 3, hours: 18 }),
        end_date: jour.plus({ days: 3, hours: 19, minutes: 30 }),
        location: null,
        userId: user.id,
        groupId: null,
      },
    ])
  }
}
