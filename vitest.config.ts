import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/tests/**/*.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['src/tests/setup.ts']
  }
});
