/// <reference types="cypress" />

/**
 * Parcours e2e : le clic sur le StatusBadge fait tourner le statut
 * (À faire -> En cours -> Terminé -> À faire) sans ouvrir le modal.
 */
const USER = { email: 'morgan@test.com', password: 'password' }

const NEXT_LABEL: Record<string, string> = {
  'À faire': 'En cours',
  'En cours': 'Terminé',
  Terminé: 'À faire',
}

describe('Cycle de statut (StatusBadge)', () => {
  beforeEach(() => {
    cy.login(USER.email, USER.password)
    cy.visit('/todolists')
  })

  it('passe au statut suivant au clic et n’ouvre pas le modal', () => {
    cy.get('[data-cy=task-card]')
      .first()
      .within(() => {
        cy.get('[data-cy=status-badge]')
          .invoke('text')
          .then((raw) => {
            const current = raw.trim()
            const expected = NEXT_LABEL[current]

            cy.get('[data-cy=status-badge]').click()
            // Après le rechargement Inertia, le badge affiche le statut suivant
            cy.get('[data-cy=status-badge]').should('contain', expected)
          })
      })

    // Le clic sur le badge ne doit pas avoir ouvert le modal de tâche
    cy.get('[data-cy=calendar-picker]').should('not.exist')
    cy.get('[role=dialog]').should('not.exist')
  })
})
