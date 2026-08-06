/**
 * Создание первого администратора.
 *
 * Логин и пароль берутся только из окружения — дефолтных значений в коде нет.
 * Скрипт идемпотентен: существующий пользователь не перезаписывается.
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const run = async () => {
  const email = process.env.ADMIN_EMAIL?.trim()
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME?.trim() || 'Администратор'

  if (!email || !password) {
    console.error('Задайте ADMIN_EMAIL и ADMIN_PASSWORD в окружении и повторите запуск.')
    process.exit(1)
  }
  if (password.length < 12) {
    console.error('ADMIN_PASSWORD должен быть не короче 12 символов.')
    process.exit(1)
  }

  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    console.log(`Пользователь ${email} уже существует — изменений не внесено.`)
    process.exit(0)
  }

  await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { email, password, name, role: 'admin', active: true },
  })

  console.log(`Администратор ${email} создан. Войдите на /admin.`)
  process.exit(0)
}

run().catch((error) => {
  console.error('Не удалось создать администратора:', error)
  process.exit(1)
})
