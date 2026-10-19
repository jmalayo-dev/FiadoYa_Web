import { defineConfig, devices } from '@playwright/test';

/**
 * E2E (Especificación §12). Por defecto contra mocks (levanta Vite en modo mocks).
 * Contra el stack Docker: E2E_BASE_URL=http://localhost:80 E2E_ADMIN_PASSWORD=... npm run e2e
 */
const base = process.env.E2E_BASE_URL;
const puerto = Number(process.env.E2E_PORT ?? 5199);

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: base ?? `http://localhost:${puerto}`,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'movil-390', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'escritorio-1366', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
  ],
  webServer: base
    ? undefined
    : { command: `npx vite --mode mocks --port ${puerto} --strictPort`, url: `http://localhost:${puerto}`, reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
