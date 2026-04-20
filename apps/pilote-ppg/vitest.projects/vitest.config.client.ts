import tsconfigPaths from 'vite-tsconfig-paths';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [tsconfigPaths()],
  test: {
    name: 'client',
    root: './',
    environment: 'jsdom',
    include: [
      'src/client/**/*.unit.test.{ts,tsx}',
      'src/client/**/*.integration.test.{ts,tsx}',
    ],
    setupFiles: ['./vitest.setup.ts'],
    pool: 'threads',
    globals: true,
    server: {
      deps: {
        inline: [
          '@asamuzakjp/css-color',
          '@csstools/css-tokenizer',
          '@csstools/css-calc',
          '@csstools/css-color-parser',
          '@csstools/css-parser-algorithms',
        ],
      },
    },
  },
});
