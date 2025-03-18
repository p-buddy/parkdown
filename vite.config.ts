import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

const testPattern = "src/**/*.{test,spec}.{js,ts}"

export default defineConfig({
  plugins: [dts({ exclude: testPattern, rollupTypes: true }), externalizeDeps({ nodeBuiltins: true })],
  build: {
    lib: {
      name: 'index',
      fileName: 'index',
      entry: resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    include: [testPattern],
  },
})