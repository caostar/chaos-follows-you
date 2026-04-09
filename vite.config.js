import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/chaos-follows-you/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  assetsInclude: ['**/*.vert', '**/*.frag'],
  test: {
    environment: 'jsdom',
  },
});
