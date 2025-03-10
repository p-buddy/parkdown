import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { externalizeDeps } from 'vite-plugin-externalize-deps'
import { name as packageName } from './package.json';

export default defineConfig({
  resolve: {
    alias: {
      './': packageName,
      './index': packageName,
    },
  },
  plugins: [externalizeDeps({ nodeBuiltins: false, devDeps: true, include: [packageName] })],
  build: {
    lib: {
      fileName: 'cli',
      entry: resolve(__dirname, 'src/cli.ts'),
      formats: ['es']
    },
    emptyOutDir: false,
  }
});