import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    globals: true,
    reporters: ['verbose'],
    disableConsoleIntercept: true,
    include: ['**/*.test.ts', '**/*.test.ts', '**/*.e2e-test.ts'],
    // timeout for test
    testTimeout: 9999999,
    // timeout for afterAll, afterEach, beforeEach, beforeAll
    hookTimeout: 9999999,

    poolOptions: {
      forks: {
        execArgv: ['--env-file=.env'],
      },
    },
  },
  plugins: [tsconfigPaths()],
})
