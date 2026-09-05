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
      // `redirect: 'manual'` prevents fetch from silently following a redirect
      // to Vercel's Deployment Protection login page (which itself returns a
      // 200), so a redirected request is correctly reported as a redirect
      // rather than masquerading as a successful response.
      const res = await fetch(`${STAGING_URL}${route}`, { redirect: 'manual' })
      expect(res.status).toBe(200)

      // Also verify the body is actually the site, not some other 200 page.
      const body = await res.text()
      expect(body).toContain('Proper Painter')
    }
  }, 30000)
})
