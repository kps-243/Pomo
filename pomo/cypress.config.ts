import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // L'app AdonisJS doit tourner (npm run dev) avec une base seedée.
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:3333',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
    viewportWidth: 1280,
    viewportHeight: 800,
  },
})
