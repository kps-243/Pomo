import User from '#models/user'
import Group from '#models/group'
import ToDoList from '#models/to_do_list'
import Task from '#models/task'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import type { DurationLikeObject } from 'luxon'

type Status = 'todo' | 'in_progress' | 'done'

interface SeedTask {
  title: string
  description: string
  status: Status
  due: DurationLikeObject
  duration: number
  creator: User
  members: User[]
}

export default class extends BaseSeeder {
  async run() {
    const [test, william, morgan, john, jane, alex] = await Promise.all([
      User.findByOrFail('email', 'test@test.com'),
      User.findByOrFail('email', 'williamwaterpolo@gmail.com'),
      User.findByOrFail('email', 'morgan@test.com'),
      User.findByOrFail('email', 'john@okey.com'),
      User.findByOrFail('email', 'jane@okey.com'),
      User.findByOrFail('email', 'alex@okey.com'),
    ])

    const equipe = await this.createGroup({
      name: 'Équipe Pomo',
      description: 'Coordination du projet annuel Pomo',
      owner: test,
      members: [william, morgan, jane],
    })
    await this.addTasks(equipe, [
      {
        title: 'Sprint review',
        description: "Bilan du sprint avec l'équipe",
        status: 'todo',
        due: { days: 1, hours: 10 },
        duration: 60,
        creator: test,
        members: [test, william],
      },
      {
        title: 'Rédiger le cahier des charges',
        description: 'Version finale pour le jury',
        status: 'in_progress',
        due: { hours: 14 },
        duration: 120,
        creator: william,
        members: [william],
      },
      {
        title: 'Mettre en place la CI',
        description: 'GitHub Actions + suite de tests',
        status: 'todo',
        due: { days: 2, hours: 9 },
        duration: 90,
        creator: morgan,
        members: [morgan, test],
      },
      {
        title: 'Préparer la démo',
        description: 'Scénario de démonstration',
        status: 'done',
        due: { days: -1, hours: 16 },
        duration: 45,
        creator: jane,
        members: [jane, william],
      },
    ])

    const waterpolo = await this.createGroup({
      name: 'Water-polo M1',
      description: 'Organisation des entraînements et des matchs',
      owner: william,
      members: [test, john, alex],
    })
    await this.addTasks(waterpolo, [
      {
        title: 'Réserver la piscine',
        description: 'Créneau du samedi matin',
        status: 'done',
        due: { days: -1, hours: 9 },
        duration: 30,
        creator: william,
        members: [william, test],
      },
      {
        title: 'Planifier le tournoi',
        description: 'Poules et calendrier des matchs',
        status: 'in_progress',
        due: { days: 3, hours: 18 },
        duration: 90,
        creator: william,
        members: [william, john],
      },
      {
        title: 'Acheter le matériel',
        description: 'Ballons et bonnets',
        status: 'todo',
        due: { days: 2, hours: 11 },
        duration: 60,
        creator: alex,
        members: [alex],
      },
      {
        title: 'Contacter les autres équipes',
        description: 'Organiser des matchs amicaux',
        status: 'todo',
        due: { days: 4, hours: 15 },
        duration: 45,
        creator: john,
        members: [john, william],
      },
    ])
  }

  private async createGroup(opts: {
    name: string
    description: string
    owner: User
    members: User[]
  }) {
    const group = await Group.create({
      name: opts.name,
      description: opts.description,
      ownerId: opts.owner.id,
    })
    await group.related('members').attach({ [opts.owner.id]: { role: 'owner' } })
    for (const member of opts.members) {
      await group.related('members').attach({ [member.id]: { role: 'member' } })
    }
    const list = await ToDoList.create({
      name: group.name,
      userId: opts.owner.id,
      groupId: group.id,
    })
    return { group, list }
  }

  private async addTasks(ctx: { group: Group; list: ToDoList }, tasks: SeedTask[]) {
    const jour = DateTime.now().startOf('day')
    let position = 0
    for (const t of tasks) {
      const task = await Task.create({
        title: t.title,
        description: t.description,
        status: t.status,
        due_date: jour.plus(t.due),
        duration: t.duration,
        userId: t.creator.id,
        groupId: ctx.group.id,
        toDoListId: ctx.list.id,
        position: position++,
      })
      await task.related('members').attach(t.members.map((member) => member.id))
    }
  }
}
