import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', 'src/cli.ts', 'src/enums/**/*.ts'],
      skipFull: true,
    },
    globals: true,
    environment: 'jsdom',
    passWithNoTests: true,
    pool: 'forks',
  },
})
