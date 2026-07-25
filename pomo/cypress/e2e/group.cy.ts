/// <reference types="cypress" />

/**
 * Parcours e2e des groupes (s'appuie sur les données seedées).
 * test@test.com est propriétaire de « Équipe Pomo » et membre de « Water-polo M1 ».
 */
const USER = { email: 'test@test.com', password: 'TESTtest00!!' }

describe('Groupes', () => {
  beforeEach(() => {
    cy.login(USER.email, USER.password)
    cy.visit('/groups')
  })

  it('affiche les groupes seedés (propriétaire et membre)', () => {
    cy.get('[data-cy=group-card]').should('have.length.at.least', 2)
    cy.contains('[data-cy=group-card]', 'Équipe Pomo').should('be.visible')
    cy.contains('[data-cy=group-card]', 'Water-polo M1').should('be.visible')
  })

  it('crée un nouveau groupe qui apparaît dans la liste', () => {
    const name = `Groupe E2E ${Date.now()}`

    cy.get('[data-cy=create-group]').click()
    cy.get('[data-cy=group-name-input]').type(name)
    cy.get('[data-cy=submit-group]').click()

    cy.contains('[data-cy=group-card]', name).should('be.visible')
  })

  it('ouvre un groupe et affiche ses membres', () => {
    cy.contains('[data-cy=group-card]', 'Équipe Pomo').click()

    cy.location('pathname').should('match', /\/groups\/\d+/)
    cy.get('[data-cy=group-name]').should('contain', 'Équipe Pomo')
    // « Équipe Pomo » : le propriétaire + 3 membres.
    cy.get('[data-cy=member-row]').should('have.length', 4)
    // Le propriétaire voit le bouton d'invitation.
    cy.get('[data-cy=invite-button]').should('exist')
  })
})
