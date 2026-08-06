import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

/**
 * Путь к Chromium задаётся переменной окружения, когда браузеры установлены
 * не в стандартный каталог Playwright (например, в CI-образе).
 */
const executablePath = process.env.E2E_CHROMIUM_PATH || undefined

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    locale: 'ru-RU',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      // Мобильные сценарии проверяются отдельным проектом с тач-вьюпортом.
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'mobile',
      // Дескриптор iPhone по умолчанию тянет WebKit; браузер фиксируем на Chromium,
      // сохраняя мобильный viewport, DPR и тач-события.
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: 'pnpm start',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
})
