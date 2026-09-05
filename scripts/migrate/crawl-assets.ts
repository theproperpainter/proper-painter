import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import path from 'path'

interface CrawledAsset {
  url: string
  alt: string
  sourcePage: string
}

const PAGES_TO_CRAWL = ['/', '/about', '/portfolio', '/team']

async function crawlPage(page: import('playwright').Page, pathname: string): Promise<CrawledAsset[]> {
  await page.goto(`https://www.theproperpainter.com${pathname}`, { waitUntil: 'networkidle' })
  const images = await page.$$eval('img', (imgs) =>
    imgs.map((img) => ({ url: img.src, alt: img.alt }))
  )
  return images
    .filter((img) => img.url && !img.url.startsWith('data:'))
    .map((img) => ({ ...img, sourcePage: pathname }))
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const allAssets: CrawledAsset[] = []

  for (const pathname of PAGES_TO_CRAWL) {
    const assets = await crawlPage(page, pathname)
    allAssets.push(...assets)
    console.log(`Crawled ${pathname}: found ${assets.length} real images`)
  }

  await browser.close()

  const outputPath = path.join(__dirname, 'crawled-assets.json')
  writeFileSync(outputPath, JSON.stringify(allAssets, null, 2))
  console.log(`Wrote ${allAssets.length} total assets to ${outputPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
