/// <reference types="cypress" />

/**
 * Parcours e2e : définir l'échéance d'une tâche depuis le board.
 *
 * Pré-requis (voir README / scripts) :
 *  - l'app tourne :  npm run dev           (http://localhost:3333)
 *  - la base est seedée (utilisateur morgan@test.com / password + tâches)
 */
const USER = { email: 'morgan@test.com', password: 'password' }

describe('Échéance d’une tâche (due_date)', () => {
  beforeEach(() => {
    cy.login(USER.email, USER.password)
    cy.visit('/todolists')
  })

  it('permet de choisir une date + heure et affiche le badge mis à jour', () => {
    // Ouvre la première tâche
    cy.get('[data-cy=task-card]').first().click()

    // Ouvre le sélecteur d'échéance depuis le badge de date
    cy.get('[data-cy=date-badge]').first().click()
    cy.get('[data-cy=calendar-picker]').should('be.visible')

    // Choisit le 20 du mois affiché dans le calendrier
    cy.get('[data-cy=calendar-picker]').contains(/^20$/).click({ force: true })

    // Choisit 14:30 dans le menu déroulant des heures
    cy.get('[data-cy=time-select]').click()
    cy.get('[role=option]').contains('14:30').click({ force: true })

    // Le récapitulatif reflète la sélection
    cy.get('[data-cy=calendar-picker]').should('contain', '14:30')

    // Enregistre
    cy.get('[data-cy=save-due-date]').click()

    // Le badge affiche la nouvelle heure et le picker se replie
    cy.get('[data-cy=calendar-picker]').should('not.exist')
    cy.get('[data-cy=date-badge]').should('contain', '14:30')
  })

  it('permet d’effacer une échéance existante', () => {
    cy.get('[data-cy=task-card]').first().click()
    cy.get('[data-cy=date-badge]').first().click()
    cy.get('[data-cy=calendar-picker]').should('be.visible')

    // Le bouton "Effacer" n'est présent que si une échéance existe déjà
    cy.get('[data-cy=calendar-picker]').then(($picker) => {
      if ($picker.find('button:contains("Effacer")').length) {
        cy.wrap($picker).contains('button', 'Effacer').click()
        cy.get('[data-cy=calendar-picker]').should('not.exist')
        cy.get('[data-cy=date-badge]').should('contain', 'Date')
      }
    })
  })
})
