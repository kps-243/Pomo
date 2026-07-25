import User from '#models/user'
import ToDoList from '#models/to_do_list'
import Task from '#models/task'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const william = await User.create({
      username: 'williamwaterpolo',
      email: 'williamwaterpolo@gmail.com',
      password: 'TESTtest00!!',
      first_name: 'William',
      last_name: 'Correia',
    })

    const [projet, sport, admin, maison] = await ToDoList.createMany([
      { name: 'Projet annuel Pomo', userId: william.id },
      { name: 'Sport & santé', userId: william.id },
      { name: 'Administratif', userId: william.id },
      { name: 'Maison & courses', userId: william.id },
    ])

    const jour = DateTime.now().startOf('day')

    await Task.createMany([
      {
        title: 'Finaliser les groupes & calendrier partagé',
        description: 'Relations, permissions et affichage',
        status: 'in_progress',
        due_date: jour.plus({ hours: 10 }),
        duration: 120,
        userId: william.id,
        position: 0,
        toDoListId: projet.id,
      },
      {
        title: 'Écrire les tests fonctionnels',
        description: 'Couvrir les groupes et les tâches partagées',
        status: 'todo',
        due_date: jour.plus({ days: 1, hours: 14 }),
        duration: 90,
        userId: william.id,
        position: 1,
        toDoListId: projet.id,
      },
      {
        title: "Corriger le bug d'ajout de tâche partagée",
        description: 'Membre non-propriétaire bloqué',
        status: 'done',
        due_date: jour.minus({ days: 1 }).plus({ hours: 16 }),
        duration: 45,
        userId: william.id,
        position: 2,
        toDoListId: projet.id,
      },
      {
        title: 'Préparer la soutenance du projet annuel',
        description: 'Slides + démo live',
        status: 'todo',
        due_date: jour.plus({ days: 3, hours: 9 }),
        duration: 120,
        userId: william.id,
        position: 3,
        toDoListId: projet.id,
      },

      {
        title: 'Entraînement water-polo',
        description: 'Séance technique + physique',
        status: 'todo',
        due_date: jour.plus({ hours: 19 }),
        duration: 90,
        userId: william.id,
        position: 0,
        toDoListId: sport.id,
      },
      {
        title: 'Musculation haut du corps',
        description: 'Tractions, développé, gainage',
        status: 'done',
        due_date: jour.minus({ days: 1 }).plus({ hours: 18 }),
        duration: 60,
        userId: william.id,
        position: 1,
        toDoListId: sport.id,
      },
      {
        title: 'Séance natation 2 km',
        description: 'Endurance crawl',
        status: 'todo',
        due_date: jour.plus({ days: 2, hours: 7 }),
        duration: 60,
        userId: william.id,
        position: 2,
        toDoListId: sport.id,
      },

      {
        title: 'Renouveler la licence sportive',
        description: 'Certificat médical à joindre',
        status: 'todo',
        due_date: jour.plus({ days: 1, hours: 11 }),
        duration: 30,
        userId: william.id,
        position: 0,
        toDoListId: admin.id,
      },
      {
        title: 'Déclarer les impôts',
        description: 'Vérifier les cases étudiant',
        status: 'todo',
        due_date: jour.plus({ days: 5, hours: 10 }),
        duration: 60,
        userId: william.id,
        position: 1,
        toDoListId: admin.id,
      },
      {
        title: 'Prendre rendez-vous médecin',
        description: 'Bilan annuel',
        status: 'done',
        due_date: jour.minus({ days: 1 }).plus({ hours: 9 }),
        duration: 15,
        userId: william.id,
        position: 2,
        toDoListId: admin.id,
      },

      {
        title: 'Courses de la semaine',
        description: 'Marché puis supermarché',
        status: 'todo',
        due_date: jour.plus({ hours: 18 }),
        duration: 45,
        userId: william.id,
        position: 0,
        toDoListId: maison.id,
      },
      {
        title: 'Réparer le vélo',
        description: 'Changer la chambre à air',
        status: 'todo',
        due_date: jour.plus({ days: 2, hours: 15 }),
        duration: 60,
        userId: william.id,
        position: 1,
        toDoListId: maison.id,
      },
      {
        title: 'Ménage appartement',
        description: 'Grand nettoyage de printemps',
        status: 'done',
        due_date: jour.minus({ days: 1 }).plus({ hours: 11 }),
        duration: 90,
        userId: william.id,
        position: 2,
        toDoListId: maison.id,
      },
    ])
  }
}
