import './commands'

beforeEach(() => {
  // Le bandeau de consentement cookies est en position fixed en bas d'écran.
  // En le marquant comme déjà accepté, il ne s'affiche pas et n'intercepte
  // pas les clics des tests E2E.
  cy.window().then((win) => {
    win.localStorage.setItem('pomo-cookie-consent', 'accepted')
  })
})
