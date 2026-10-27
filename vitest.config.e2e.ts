import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    dedupe: ['graphql'],
    tsconfigPaths: true,
  },
  server: {
    deps: {
      inline: ['graphql', '@nestjs/graphql'],
    },
  },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
  },
});
