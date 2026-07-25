import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Tests unitaires du front (logique pure). Volontairement limités à `inertia/**`
// pour ne pas entrer en collision avec les tests Japa (`tests/**/*.spec.ts`).
export default defineConfig({
  resolve: {
    alias: {
      '~/': `${fileURLToPath(new URL('./inertia/', import.meta.url))}`,
    },
  },
  test: {
    include: ['inertia/**/*.test.ts'],
    environment: 'node',
  },
})
