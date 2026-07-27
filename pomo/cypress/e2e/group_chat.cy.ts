/// <reference types="cypress" />

/**
 * Parcours e2e du tchat de groupe (s'appuie sur les données seedées).
 * test@test.com est propriétaire de « Équipe Pomo ».
 *
 * Le temps réel entre deux navigateurs n'est pas couvert ici : il l'est par le
 * test fonctionnel Japa (tests/functional/group_chat.spec.ts), qui pilote deux
 * clients WebSocket. Ce spec vérifie l'intégration de la colonne dans la page.
 */
const USER = { email: 'test@test.com', password: 'TESTtest00!!' }

describe('Tchat de groupe', () => {
  beforeEach(() => {
    cy.login(USER.email, USER.password)
    cy.visit('/groups')
    cy.contains('[data-cy=group-card]', 'Équipe Pomo').click()
    cy.location('pathname').should('match', /\/groups\/\d+/)
  })

  it('affiche la colonne de tchat et établit la connexion WebSocket', () => {
    cy.get('[data-cy=chat-messages]').should('be.visible')
    cy.get('[data-cy=chat-input]').should('be.visible')
    // La pastille passe au vert une fois la handshake acceptée.
    cy.get('[data-cy=chat-status]').should('have.class', 'bg-success')
  })

  it('supprime son propre message, qui disparaît du fil', () => {
    const content = `À supprimer ${Date.now()}`

    cy.get('[data-cy=chat-input]').type(content)
    cy.get('[data-cy=chat-send]').click()
    // `exist` et non `be.visible` : la position de défilement du fil dépend du
    // moment où les icônes chargées à la volée rallongent le contenu, ce qui
    // rendait l'assertion instable. L'affichage temps réel est couvert côté
    // serveur par tests/functional/group_chat.spec.ts (deux clients WebSocket).
    cy.contains('[data-cy=chat-message]', content).should('exist')

    cy.on('window:confirm', () => true)
    cy.contains('[data-cy=chat-message]', content)
      .find('[data-cy=delete-message]')
      .click({ force: true })

    cy.contains('[data-cy=chat-message]', content).should('not.exist')
    cy.reload()
    cy.contains('[data-cy=chat-message]', content).should('not.exist')
  })

  it('ne propose pas de signaler ses propres messages', () => {
    const content = `Mon message ${Date.now()}`

    cy.get('[data-cy=chat-input]').type(content)
    cy.get('[data-cy=chat-send]').click()

    cy.contains('[data-cy=chat-message]', content)
      .find('[data-cy=report-message]')
      .should('not.exist')
  })
})
