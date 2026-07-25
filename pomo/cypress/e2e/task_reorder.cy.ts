/// <reference types="cypress" />

const USER = { email: 'test@test.com', password: 'TESTtest00!!' }

const titres = () =>
  cy
    .get('section')
    .first()
    .find('[data-cy=task-card] h4')
    .then(($h) => [...$h].map((h) => h.textContent!.trim()))

const glisser = (depuis: number, vers: number) =>
  cy.window().then((win) => {
    const cartes = win.document.querySelectorAll('section [data-cy=task-card]')
    const source = cartes[depuis] as HTMLElement
    const rs = source.getBoundingClientRect()
    const rc = (cartes[vers] as HTMLElement).getBoundingClientRect()
    const x = rs.left + rs.width / 2
    const depart = rs.top + rs.height / 2
    const arrivee = rc.top + rc.height / 2

    const envoyer = (type: string, clientY: number, cible: EventTarget) => {
      const commun = { bubbles: true, cancelable: true, clientX: x, clientY, button: 0, buttons: 1 }
      cible.dispatchEvent(
        type.startsWith('pointer')
          ? new win.PointerEvent(type, {
              ...commun,
              pointerId: 1,
              pointerType: 'mouse',
              isPrimary: true,
            })
          : new win.MouseEvent(type, commun)
      )
    }

    envoyer('pointerdown', depart, source)
    envoyer('mousedown', depart, source)

    return new Cypress.Promise<void>((resolve) => {
      let etape = 0
      const timer = win.setInterval(() => {
        etape++
        const y = depart + ((arrivee - depart) * etape) / 10
        envoyer('pointermove', y, win.document)
        envoyer('mousemove', y, win.document)
        if (etape >= 10) {
          win.clearInterval(timer)
          envoyer('pointerup', arrivee, win.document)
          envoyer('mouseup', arrivee, win.document)
          resolve()
        }
      }, 40)
    })
  })

describe('Réordonnancement des tasks (drag and drop)', () => {
  beforeEach(() => {
    cy.login(USER.email, USER.password)
    cy.visit('/todolists')
    cy.get('[data-cy=task-card]').should('have.length.greaterThan', 2)
  })

  it('déplace une task et persiste le nouvel ordre', () => {
    titres().then((initial) => {
      glisser(0, 2)

      const attendu = [initial[1], initial[2], initial[0], ...initial.slice(3)]
      titres().should('deep.equal', attendu)

      cy.reload()
      cy.get('section').first().find('[data-cy=task-card]').should('have.length', initial.length)
      titres().should('deep.equal', attendu)
    })
  })

  it('un clic simple ouvre toujours la modale', () => {
    cy.get('[data-cy=task-card]').first().click()
    cy.get('[role=dialog]').should('be.visible')
  })
})
