/// <reference types="cypress" />

/**
 * Connecte un utilisateur via le formulaire de login (parcours e2e réel).
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('input[type="email"]').clear().type(email)
    cy.get('input[type="password"]').clear().type(password)
    cy.get('button[type="submit"]').click()
    // On attend d'avoir quitté la page de login.
    cy.location('pathname').should('not.include', '/login')
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
    }
  }
}

export {}
