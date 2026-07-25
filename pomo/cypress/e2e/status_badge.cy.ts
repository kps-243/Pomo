/// <reference types="cypress" />

/**
 * Parcours e2e : le clic sur le StatusBadge fait tourner le statut
 * (À faire -> En cours -> Terminé -> À faire) sans ouvrir le modal.
 */
const USER = { email: 'morgan@test.com', password: 'password' }

const NEXT_LABEL: Record<string, string> = {
  'À faire': 'En cours',
  'En cours': 'Terminé',
  'Terminé': 'À faire',
}

describe('Cycle de statut (StatusBadge)', () => {
  beforeEach(() => {
    cy.login(USER.email, USER.password)
    cy.visit('/todolists')
  })

  it('passe au statut suivant au clic et n’ouvre pas le modal', () => {
    // On re-cible le badge à chaque fois (fonction) : après le rechargement Inertia
    // l'ancien DOM est détaché, il faut donc re-résoudre depuis la racine.
    const statusBadge = () => cy.get('[data-cy=task-card]').first().find('[data-cy=status-badge]')

    statusBadge()
      .invoke('text')
      .then((raw) => {
        const expected = NEXT_LABEL[raw.trim()]

        statusBadge().click()
        // Après le rechargement Inertia, le badge affiche le statut suivant
        statusBadge().should('contain', expected)
      })

    // Le clic sur le badge ne doit pas avoir ouvert le modal de tâche
    cy.get('[data-cy=calendar-picker]').should('not.exist')
    cy.get('[role=dialog]').should('not.exist')
  })
})
