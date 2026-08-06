import { expect, test } from '@playwright/test'

/** Шум разработки и внешние ресурсы не считаем ошибками сайта. */
const isRelevantError = (text: string) =>
  !/hmr|websocket|favicon|devtools|Download the React DevTools/i.test(text)

test.describe('Публичный сайт', () => {
  test('главная загружается без критических ошибок консоли', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' && isRelevantError(message.text())) errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto('/')
    await expect(page).toHaveTitle(/Серая Мышь/)
    await page.waitForTimeout(2500)

    expect(errors, `console errors:\n${errors.join('\n')}`).toHaveLength(0)
  })

  test('текст первого экрана доступен до загрузки 3D-сцены', async ({ browser }) => {
    // Контекст без JavaScript: сцена не может отрисоваться в принципе.
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Смотреть кейсы' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Обсудить проект' }).first()).toBeVisible()
    expect(await page.locator('canvas').count()).toBe(0)

    await context.close()
  })

  test('3D-сцена появляется и не перехватывает клики по кнопкам', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('canvas')).toHaveCount(1, { timeout: 20_000 })

    await page.getByRole('link', { name: 'Смотреть кейсы' }).click()
    await expect(page).toHaveURL(/\/cases$/)
  })

  test('при prefers-reduced-motion контент виден сразу', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Блоки с reveal не должны оставаться прозрачными.
    const opacity = await page
      .locator('[data-reveal]')
      .first()
      .evaluate((node) => getComputedStyle(node).opacity)
    expect(Number(opacity)).toBe(1)

    await context.close()
  })

  test('основная навигация работает', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Основная навигация' })

    await nav.getByRole('link', { name: 'Услуги' }).click()
    await expect(page).toHaveURL(/\/services$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Что мы делаем')

    await nav.getByRole('link', { name: 'О студии' }).click()
    await expect(page).toHaveURL(/\/about$/)

    await nav.getByRole('link', { name: 'Контакты' }).click()
    await expect(page).toHaveURL(/\/contact$/)
  })

  test('skip-link ведёт к основному содержимому с клавиатуры', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.locator('.gm-skip-link')
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main$/)
  })

  test('страница кейсов открывается и показывает опубликованные кейсы', async ({ page }) => {
    await page.goto('/cases')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Что мы сделали')

    const cards = page.locator('article')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('черновик не виден на публичном сайте', async ({ page }) => {
    await page.goto('/cases')
    await expect(page.getByText('Панель управления складом')).toHaveCount(0)

    const response = await page.goto('/cases/demo-internal-dashboard')
    expect(response?.status()).toBe(404)
  })

  test('фильтр меняет выдачу и синхронизируется с URL', async ({ page }) => {
    await page.goto('/cases')
    const counter = page.getByText(/Показано:|Ничего не найдено/)
    const before = await counter.textContent()

    await page.getByRole('link', { name: 'E-commerce', exact: true }).click()
    await expect(page).toHaveURL(/category=ecommerce/)
    await expect(counter).not.toHaveText(before ?? '')

    // Ссылка на отфильтрованную выдачу работает после перезагрузки.
    await page.reload()
    await expect(page.getByRole('link', { name: 'E-commerce', exact: true })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  test('фильтры доступны с клавиатуры', async ({ page }) => {
    await page.goto('/cases')
    const chip = page.getByRole('link', { name: 'E-commerce', exact: true })
    await chip.focus()
    await expect(chip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/category=ecommerce/)
  })

  test('фильтрация работает без JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/cases?category=ecommerce')

    await expect(page.getByText(/Показано: 1 из/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'E-commerce', exact: true })).toHaveAttribute(
      'aria-current',
      'true',
    )
    await context.close()
  })

  test('поиск показывает корректное пустое состояние', async ({ page }) => {
    await page.goto('/cases')
    await page.getByLabel('Поиск').fill('такогокейсанет')
    await expect(page.getByText('Под эти условия кейсов нет')).toBeVisible()
    await expect(page.getByText('Ничего не найдено')).toBeVisible()
  })

  test('кейс открывается по slug', async ({ page }) => {
    await page.goto('/cases/demo-logistics-platform')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Платформа')
    await expect(page.getByText('Клиент', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Обсудить проект' }).first()).toBeVisible()
  })

  test('неизвестный slug возвращает 404', async ({ page }) => {
    const response = await page.goto('/cases/no-such-case-9999')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Такой страницы нет')
  })

  test('SEO-файлы генерируются', async ({ request }) => {
    const robots = await request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    expect(await robots.text()).toContain('Sitemap:')

    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)
    const xml = await sitemap.text()
    expect(xml).toContain('/cases/demo-logistics-platform')
    // Черновик не должен попадать в карту сайта.
    expect(xml).not.toContain('demo-internal-dashboard')
  })

  test('структурированные данные организации присутствуют', async ({ page }) => {
    await page.goto('/')
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
    const parsed = JSON.parse(jsonLd ?? '{}')
    expect(parsed['@type']).toBe('ProfessionalService')
  })

  test('админка закрыта от индексации', async ({ request }) => {
    const response = await request.get('/admin/login')
    expect(response.headers()['x-robots-tag']).toContain('noindex')
  })
})
