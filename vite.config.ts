import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
  plugins: [dts(), externalizeDeps()],
  build: {
    lib: {
      name: 'index',
      fileName: 'index',
      entry: resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
  },
})