import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'packages/*/src/**/*.test.ts'],
    exclude: ['tests/integration/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['packages/shared/src/**'],
    },
  },
  resolve: {
    alias: {
      '@ftth/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
    },
  },
})
