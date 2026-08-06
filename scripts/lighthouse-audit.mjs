// Прогон Lighthouse по production-сборке.
// Запускать при работающем `pnpm start`.
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SITE_URL || 'http://localhost:3000'
const OUT = path.resolve('research/lighthouse')

const PAGES = [
  { id: 'home', url: '/' },
  { id: 'cases', url: '/cases' },
  { id: 'case-detail', url: '/cases/demo-logistics-platform' },
]

const FORM_FACTORS = [
  {
    id: 'mobile',
    settings: { formFactor: 'mobile', screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false } },
  },
  {
    id: 'desktop',
    settings: {
      formFactor: 'desktop',
      screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
      throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
    },
  },
]

const run = async () => {
  await mkdir(OUT, { recursive: true })
  const chrome = await launch({
    chromePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    chromeFlags: ['--headless=new', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  })

  const summary = []

  for (const formFactor of FORM_FACTORS) {
    for (const target of PAGES) {
      const result = await lighthouse(
        `${BASE}${target.url}`,
        { port: chrome.port, output: ['json'], logLevel: 'error' },
        {
          extends: 'lighthouse:default',
          settings: {
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
            ...formFactor.settings,
          },
        },
      )

      const lhr = result.lhr
      const row = {
        page: target.id,
        formFactor: formFactor.id,
        performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
        accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
        seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
        fcp: lhr.audits['first-contentful-paint']?.displayValue,
        lcp: lhr.audits['largest-contentful-paint']?.displayValue,
        cls: lhr.audits['cumulative-layout-shift']?.displayValue,
        tbt: lhr.audits['total-blocking-time']?.displayValue,
        speedIndex: lhr.audits['speed-index']?.displayValue,
        failedAudits: Object.values(lhr.audits)
          .filter((audit) => audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== 'informative')
          .map((audit) => `${audit.id}: ${audit.title}`)
          .slice(0, 12),
      }
      summary.push(row)
      console.log(
        `${formFactor.id.padEnd(8)} ${target.id.padEnd(12)} perf=${row.performance} a11y=${row.accessibility} bp=${row.bestPractices} seo=${row.seo} LCP=${row.lcp} CLS=${row.cls} TBT=${row.tbt}`,
      )

      await writeFile(
        path.join(OUT, `${formFactor.id}-${target.id}.json`),
        JSON.stringify(lhr, null, 1),
      )
    }
  }

  await chrome.kill()
  await writeFile(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log(`\nWROTE ${path.join(OUT, 'summary.json')}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
