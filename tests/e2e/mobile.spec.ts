import { expect, test } from '@playwright/test'

test.describe('Мобильная версия', () => {
  test('мобильное меню открывается, работает и возвращает фокус', async ({ page }) => {
    await page.goto('/')

    const trigger = page.getByRole('button', { name: 'Открыть меню' })
    await expect(trigger).toBeVisible()
    await trigger.click()

    const dialog = page.getByRole('dialog', { name: 'Меню' })
    await expect(dialog).toBeVisible()

    // Escape закрывает и возвращает фокус на кнопку.
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Открыть меню' })).toBeFocused()
  })

  test('переход по пункту меню закрывает панель', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Открыть меню' }).click()
    await page.getByRole('dialog', { name: 'Меню' }).getByRole('link', { name: 'Кейсы' }).click()

    await expect(page).toHaveURL(/\/cases$/)
    await expect(page.getByRole('dialog', { name: 'Меню' })).toBeHidden()
  })

  test('нет горизонтального переполнения на ключевых страницах', async ({ page }) => {
    for (const path of ['/', '/cases', '/cases/demo-logistics-platform', '/services', '/contact']) {
      await page.goto(path)
      await page.waitForTimeout(800)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `горизонтальное переполнение на ${path}`).toBeLessThanOrEqual(1)
    }
  })
})
