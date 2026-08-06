import { expect, test } from '@playwright/test'

test.describe('Форма контактов', () => {
  test('показывает ошибки серверной валидации', async ({ page }) => {
    await page.goto('/contact')

    await page.getByLabel(/Как к вам обращаться/).fill('А')
    await page.getByLabel(/Email или Telegram/).fill('не-контакт')
    await page.getByLabel(/Что нужно сделать/).fill('коротко')
    await page.getByLabel(/обработку персональных данных/).check()

    await page.getByRole('button', { name: 'Отправить заявку' }).click()

    await expect(page.getByText('Проверьте отмеченные поля.')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Укажите имя')).toBeVisible()
    await expect(page.getByText('Укажите корректный email или ник в Telegram')).toBeVisible()
  })

  test('требует согласия на обработку данных', async ({ page }) => {
    await page.goto('/contact')
    await page.getByLabel(/Как к вам обращаться/).fill('Анна')
    await page.getByLabel(/Email или Telegram/).fill('anna@example.com')
    await page
      .getByLabel(/Что нужно сделать/)
      .fill('Нужен сайт для сервиса записи, расскажите про сроки и стоимость.')

    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText('Без согласия мы не можем обработать заявку')).toBeVisible({
      timeout: 20_000,
    })
  })

  test('принимает корректную заявку', async ({ page }) => {
    await page.goto('/contact')
    // Форма отклоняет мгновенную отправку — ждём порог заполнения.
    await page.waitForTimeout(3000)

    await page.getByLabel(/Как к вам обращаться/).fill('Анна Тестова')
    await page.getByLabel(/Email или Telegram/).fill('anna.test@example.com')
    await page
      .getByLabel(/Что нужно сделать/)
      .fill('Нужен сайт для сервиса онлайн-записи. Расскажите про сроки и стоимость работ.')
    await page.getByLabel(/обработку персональных данных/).check()

    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText('Заявка отправлена')).toBeVisible({ timeout: 25_000 })
  })

  test('поля формы связаны с подписями', async ({ page }) => {
    await page.goto('/contact')
    for (const label of [/Как к вам обращаться/, /Email или Telegram/, /Что нужно сделать/]) {
      await expect(page.getByLabel(label)).toBeVisible()
    }
  })
})
