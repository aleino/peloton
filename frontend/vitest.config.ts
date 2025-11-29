/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      include: ['**/*.test.{ts,tsx}'],
      benchmark: {
        include: ['**/*.bench.{ts,tsx}'],
      },
      env: {
        VITE_API_BASE_URL: 'http://localhost:3000/api/v1',
        VITE_MAPBOX_TOKEN: 'pk.test_token',
        VITE_DEFAULT_LOCALE: 'en',
        VITE_ENABLE_ANALYTICS: 'false',
        VITE_ENABLE_DEBUG_MODE: 'false',
        VITE_ENV: 'test',
      },
    },
  })
);
