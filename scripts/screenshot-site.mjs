// Снимает скриншоты собственной реализации во всех требуемых размерах
// и проверяет горизонтальное переполнение и ошибки консоли.
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SITE_URL || 'http://127.0.0.1:3000'
const OUT = path.resolve(process.env.OUT_DIR || 'research/final-review')

const VIEWPORTS = [
  { id: '1440x900', width: 1440, height: 900, dpr: 1 },
  { id: '1024x768', width: 1024, height: 768, dpr: 1 },
  { id: '768x1024', width: 768, height: 1024, dpr: 1 },
  { id: '390x844', width: 390, height: 844, dpr: 2, mobile: true },
  { id: '360x800', width: 360, height: 800, dpr: 2, mobile: true },
]

const PAGES = [
  { id: 'home', url: '/' },
  { id: 'cases', url: '/cases' },
  { id: 'case-detail', url: '/cases/demo-logistics-platform' },
  { id: 'services', url: '/services' },
  { id: 'about', url: '/about' },
  { id: 'contact', url: '/contact' },
  { id: 'not-found', url: '/no-such-page-xyz' },
  { id: 'admin-login', url: '/admin/login' },
]

const run = async () => {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  })

  const report = []

  for (const viewport of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.dpr,
      isMobile: Boolean(viewport.mobile),
      hasTouch: Boolean(viewport.mobile),
      locale: 'ru-RU',
    })
    const page = await ctx.newPage()

    for (const target of PAGES) {
      const consoleErrors = []
      const pageErrors = []
      page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 220)))
      page.on('pageerror', (e) => pageErrors.push(e.message.slice(0, 220)))

      const entry = { viewport: viewport.id, page: target.id, url: target.url }
      try {
        const response = await page.goto(`${BASE}${target.url}`, {
          waitUntil: 'networkidle',
          timeout: 60000,
        })
        entry.status = response?.status()
        // Даём сцене и reveal-анимациям отработать.
        await page.waitForTimeout(target.id === 'home' ? 5000 : 1800)

        const dir = path.join(OUT, viewport.id)
        await mkdir(dir, { recursive: true })
        await page.screenshot({ path: path.join(dir, `${target.id}.png`) })
        if (target.id !== 'admin-login') {
          await page.screenshot({
            path: path.join(dir, `${target.id}-full.png`),
            fullPage: true,
          })
        }

        entry.checks = await page.evaluate(() => {
          const doc = document.documentElement
          const overflowX = doc.scrollWidth - doc.clientWidth
          const offenders = []
          if (overflowX > 1) {
            document.querySelectorAll('*').forEach((el) => {
              const rect = el.getBoundingClientRect()
              if (rect.right > doc.clientWidth + 1 || rect.left < -1) {
                offenders.push(
                  `${el.tagName}.${String(el.className).slice(0, 40)} [${Math.round(rect.left)}..${Math.round(rect.right)}]`,
                )
              }
            })
          }
          const h1s = Array.from(document.querySelectorAll('h1')).map((h) =>
            (h.textContent || '').trim().slice(0, 60),
          )
          const imagesWithoutAlt = Array.from(document.querySelectorAll('img')).filter(
            (img) => img.getAttribute('alt') === null,
          ).length
          return {
            overflowX,
            offenders: offenders.slice(0, 6),
            h1Count: h1s.length,
            h1: h1s[0] ?? null,
            imagesWithoutAlt,
            title: document.title,
            hasSkipLink: Boolean(document.querySelector('.gm-skip-link')),
          }
        })
      } catch (error) {
        entry.error = error.message.slice(0, 200)
      }

      entry.consoleErrors = consoleErrors
      entry.pageErrors = pageErrors
      page.removeAllListeners('console')
      page.removeAllListeners('pageerror')
      report.push(entry)
      console.log(
        `${viewport.id} ${target.id}: ${entry.status ?? entry.error} overflow=${entry.checks?.overflowX ?? '?'} h1=${entry.checks?.h1Count ?? '?'} errors=${consoleErrors.length + pageErrors.length}`,
      )
    }

    await ctx.close()
  }

  // Мобильное меню отдельно
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const mpage = await mctx.newPage()
  await mpage.goto(`${BASE}/cases`, { waitUntil: 'domcontentloaded' })
  await mpage.waitForTimeout(1200)
  await mpage.getByRole('button', { name: /меню/i }).click()
  await mpage.waitForTimeout(700)
  await mpage.screenshot({ path: path.join(OUT, '390x844', 'mobile-menu-open.png') })
  await mctx.close()

  await browser.close()
  await writeFile(path.join(OUT, 'review.json'), JSON.stringify(report, null, 2))
  console.log(`\nWROTE ${path.join(OUT, 'review.json')}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
