// renders docs/store/assets.html into the Chrome Web Store images next to it
// usage: bun scripts/store-assets.mjs   (CHROME_PATH=<chrome.exe> to use an installed browser)
import { chromium } from 'playwright'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'store')

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
await page.goto(pathToFileURL(join(dir, 'assets.html')).href, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)

for (const el of await page.locator('[data-out]').all()) {
  const name = await el.getAttribute('data-out')
  // every canvas has an opaque background, so chromium writes a 24-bit rgb png without alpha as the store asks
  await el.screenshot({ path: join(dir, name), animations: 'disabled' })
  console.log(name)
}
await browser.close()
