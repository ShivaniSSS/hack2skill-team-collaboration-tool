import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./setupTests.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      },
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/app/layout.js', 'src/**/*.test.{js,jsx}']
    },
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
