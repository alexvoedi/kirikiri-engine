import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', 'src/cli.ts', 'src/enums/**/*.ts'],
      cleanOnRerun: true,
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    passWithNoTests: true,
    pool: 'forks',
  },
})
