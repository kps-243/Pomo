/// <reference types="cypress" />

/**
 * Parcours e2e de la page Profil : affichage, édition, et modale de
 * suppression de compte (ouverture/annulation uniquement — on ne supprime
 * jamais le compte seedé partagé avec les autres specs e2e).
 */
const USER = { email: 'morgan@test.com', password: 'password' }

describe('Profil utilisateur', () => {
  beforeEach(() => {
    cy.login(USER.email, USER.password)
    cy.visit('/settings/profile')
  })

  it('affiche les informations actuelles du compte', () => {
    cy.get('#first_name').should('have.value', 'Morgan')
    cy.get('#last_name').should('have.value', 'Kpassi')
    cy.get('#email').should('have.value', 'morgan@test.com')
  })

  it('modifie le prénom et affiche la confirmation de succès', () => {
    cy.get('#first_name').clear().type('Morgan E2E')
    cy.get('[data-cy=save-profile]').click()

    cy.contains('Profil mis à jour').should('be.visible')
    cy.get('#first_name').should('have.value', 'Morgan E2E')

    // On restaure la valeur d'origine pour ne pas impacter les autres specs.
    cy.get('#first_name').clear().type('Morgan')
    cy.get('[data-cy=save-profile]').click()
    cy.contains('Profil mis à jour').should('be.visible')
  })

  it('ouvre la modale de suppression de compte et permet de l’annuler', () => {
    cy.get('[data-cy=open-delete-account]').click()
    cy.get('[role=dialog]').should('be.visible').and('contain', 'irréversible')

    cy.get('[role=dialog]').contains('button', 'Annuler').click()
    cy.get('[role=dialog]').should('not.exist')

    // Le compte n'a pas été supprimé : la page profil reste accessible.
    cy.visit('/settings/profile')
    cy.get('#email').should('have.value', 'morgan@test.com')
  })
})
