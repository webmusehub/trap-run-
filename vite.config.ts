import { defineConfig } from 'vite';

export default defineConfig({
  // Serve from repo root so /assets/ resolves correctly
  root: '.',
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        play: './play.html',
      },
    },
  },

  server: {
    port: 5173,
    open: false,
  },

  test: {
    // jsdom gives us window/document for InputManager keyboard tests.
    // All non-DOM tests work fine under jsdom too.
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
});
