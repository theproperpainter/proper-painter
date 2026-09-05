/**
 * @jest-environment node
 */
const STAGING_URL = process.env.STAGING_URL

// Skipped by default — set STAGING_URL to a deployed preview/production URL
// to actually run this against a live deployment.
const maybeIt = STAGING_URL ? it : it.skip

describe('staging deployment', () => {
  maybeIt('responds 200 on every site-map route', async () => {
    const routes = [
      '/',
      '/about',
      '/portfolio',
      '/team',
      '/contact',
      '/services',
      '/services/interior-painting',
      '/services/cabinetpainting',
      '/services/minor-restoration',
      '/services/wallpaper',
      '/services/colorconsult',
    ]
    for (const route of routes) {
      const res = await fetch(`${STAGING_URL}${route}`)
      expect(res.status).toBe(200)
    }
  }, 30000)
})
