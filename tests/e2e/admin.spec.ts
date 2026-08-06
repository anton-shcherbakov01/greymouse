import { expect, request as playwrightRequest, test, type Page } from '@playwright/test'

/**
 * Полный цикл редактора: вход → черновик → загрузка обложки → предпросмотр →
 * публикация → появление на сайте → правка → снятие с публикации.
 *
 * Учётные данные берутся из окружения. Production-секреты в тестах не используются.
 */
const EMAIL = process.env.E2E_ADMIN_EMAIL || process.env.ADMIN_EMAIL || ''
const PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || ''

const SLUG = 'e2e-test-case'
const TITLE = '[e2e] Тестовый кейс'

test.skip(!EMAIL || !PASSWORD, 'Не заданы E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD')

const login = async (page: Page) => {
  await page.goto('/admin/login')
  await page.locator('#field-email').fill(EMAIL)
  await page.locator('#field-password').fill(PASSWORD)
  await page.getByRole('button', { name: /Войти|Login/i }).click()
  // Ждём именно уход со страницы входа: /admin/login тоже подходит под /admin/.
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 })
}

/**
 * Ждём смену состояния, а не всплывающее уведомление: тосты живут доли секунды
 * и делают тест нестабильным.
 */
const saveDraft = async (page: Page) => {
  await page.getByRole('button', { name: /Сохранить черновик|Save draft/i }).click()
  await page.waitForURL(/\/admin\/collections\/cases\/\d+/, { timeout: 45_000 })
}

/**
 * У опубликованного документа основная кнопка — «Опубликовать изменения»,
 * у неопубликованного — «Сохранить». Берём ту, что реально есть на странице.
 */
const saveExisting = async (page: Page) => {
  const publishChanges = page.getByRole('button', {
    name: /Опубликовать изменения|Publish changes/i,
  })
  const button = (await publishChanges.count())
    ? publishChanges.first()
    : page.getByRole('button', { name: /^(Сохранить|Save)$/i }).first()

  await button.click()
  // После успешного сохранения кнопка гаснет (изменений больше нет), поэтому
  // ждём завершения запроса, а не её состояния. Результат проверяют вызывающие.
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1200)
}

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

/**
 * Удаляет кейс, созданный прошлым прогоном, — иначе уникальный slug ломает тест.
 * Токен передаётся заголовком Authorization: он не подпадает под проверку CSRF,
 * которая для куки требует Origin/Sec-Fetch-Site.
 */
const removeTestCase = async () => {
  const api = await playwrightRequest.newContext({ baseURL: BASE_URL })
  try {
    const login = await api.post('/api/users/login', {
      data: { email: EMAIL, password: PASSWORD },
      headers: { Origin: BASE_URL },
    })
    if (!login.ok()) return
    const { token } = (await login.json()) as { token?: string }
    if (!token) return
    await api.delete(`/api/cases?where[slug][equals]=${SLUG}`, {
      headers: { Authorization: `JWT ${token}` },
    })
  } finally {
    await api.dispose()
  }
}

test.beforeAll(removeTestCase)
test.afterAll(removeTestCase)

test.describe.configure({ mode: 'serial' })

test.describe('Админка', () => {
  test('требует авторизации', async ({ page }) => {
    await page.goto('/admin/collections/cases')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('отклоняет неверный пароль', async ({ page }) => {
    await page.goto('/admin/login')
    await page.locator('#field-email').fill(EMAIL)
    await page.locator('#field-password').fill('заведомо-неверный-пароль')
    await page.getByRole('button', { name: /Войти|Login/i }).click()
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('предпросмотр черновика закрыт без авторизации', async ({ request }) => {
    const response = await request.get('/preview?collection=cases&slug=demo-logistics-platform')
    expect([401, 403]).toContain(response.status())
  })

  test('редактор проходит полный цикл кейса', async ({ page }) => {
    test.slow()
    await login(page)

    // ── создание черновика ──────────────────────────────────────────────
    await page.goto('/admin/collections/cases/create')
    await page.locator('#field-title').fill(TITLE)
    await page.locator('#field-client').fill('[e2e] Клиент')
    await page.locator('#field-shortDescription').fill('Кейс, созданный автотестом.')
    await page.locator('#field-slug').fill(SLUG)

    // ── загрузка обложки ────────────────────────────────────────────────
    await page
      .locator('#field-cover')
      .getByRole('button', { name: /Создать|Загрузить|Create|Upload/i })
      .first()
      .click()

    // Поле выбора файла живёт в модальном окне и может быть скрыто визуально,
    // поэтому ждём именно присоединения к DOM.
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.waitFor({ state: 'attached', timeout: 30_000 })
    await fileInput.setInputFiles('src/seed-assets/demo-cover-1.jpg')
    await page.locator('#field-alt').last().fill('Обложка тестового кейса')
    await page
      .getByRole('button', { name: /^(Сохранить|Save)$/i })
      .last()
      .click()
    await expect(page.locator('#field-cover')).toContainText(/demo-cover-1|jpg|webp/i, {
      timeout: 30_000,
    })

    await saveDraft(page)
    // Адрес документа известен после сохранения — по нему и возвращаемся,
    // не полагаясь на поиск строки в списке.
    const docUrl = page.url()

    // Черновик не виден публично.
    const draftResponse = await page.request.get(`/cases/${SLUG}`)
    expect(draftResponse.status()).toBe(404)

    /*
      Предпросмотр открывается обычной навигацией браузера: Payload отдаёт токен
      из куки только при наличии Origin/Sec-Fetch-Site, поэтому API-клиент здесь
      не подходит — и это правильное поведение защиты от CSRF.
    */
    await page.goto(`/preview?collection=cases&slug=${SLUG}&secret=${process.env.PREVIEW_SECRET ?? ''}`)
    await expect(page).toHaveURL(new RegExp(`/cases/${SLUG}$`))
    await expect(page.getByText('Предпросмотр черновика')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Тестовый кейс')

    // Выходим из режима предпросмотра, чтобы дальше проверять публичную выдачу.
    await page.goto('/preview/exit')
    await page.goto(docUrl)

    // ── публикация ──────────────────────────────────────────────────────
    await page.getByRole('button', { name: /Опубликовать|Publish/i }).first().click()

    await expect
      .poll(async () => (await page.request.get(`/cases/${SLUG}`)).status(), { timeout: 30_000 })
      .toBe(200)

    await page.goto('/cases')
    await expect(page.getByText(TITLE)).toBeVisible({ timeout: 20_000 })

    // ── редактирование ──────────────────────────────────────────────────
    await page.goto(docUrl)
    await page.locator('#field-shortResult').fill('Тестовый результат')
    await saveExisting(page)

    // Результат одной строкой выводится в карточке списка, а не на странице кейса.
    await expect
      .poll(
        async () => {
          const html = await (await page.request.get('/cases')).text()
          return html.includes('Тестовый результат')
        },
        { timeout: 40_000 },
      )
      .toBe(true)

    // ── снятие с публикации ─────────────────────────────────────────────
    // Действие спрятано в меню «⋮» рядом с кнопкой публикации.
    await page.locator('.doc-controls .popup-button, .doc-controls__controls .popup-button').first().click()
    await page
      .getByRole('button', { name: /Отменить публикацию|Снять с публикации|Unpublish/i })
      .first()
      .click()

    // Подтверждение в модальном окне.
    const confirmButton = page
      .locator('dialog, .payload__modal-item')
      .getByRole('button', { name: /Отменить публикацию|Снять с публикации|Unpublish|Подтвердить|Confirm/i })
      .first()
    if (await confirmButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirmButton.click()
    }

    await expect
      .poll(async () => (await page.request.get(`/cases/${SLUG}`)).status(), { timeout: 30_000 })
      .toBe(404)
  })

  test('порядок кейсов на сайте следует полю сортировки', async ({ page }) => {
    await login(page)
    await page.goto('/admin/collections/cases')

    // Меняем порядок у первого демо-кейса и проверяем перестановку на сайте.
    await page.getByRole('link', { name: /Редизайн интернет-магазина/ }).click()
    await page.locator('#field-sortOrder').fill('5')
    await saveExisting(page)

    await expect
      .poll(
        async () => {
          const html = await (await page.request.get('/cases')).text()
          return html.indexOf('Редизайн интернет-магазина') < html.indexOf('логистической')
        },
        { timeout: 30_000 },
      )
      .toBe(true)

    // Возвращаем исходное значение, чтобы прогон был идемпотентным.
    await page.locator('#field-sortOrder').fill('20')
    await saveExisting(page)
  })
})
