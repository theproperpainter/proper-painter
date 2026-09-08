import type { MetadataRoute } from 'next'
import { getPortfolioCategories } from '@/lib/sanity/queries'
import { slugify } from '@/lib/slugify'

const SITE_URL = 'https://theproperpainter.com'

const STATIC_ROUTES = [
  '',
  '/about',
  '/services',
  '/services/interior-painting',
  '/services/cabinetpainting',
  '/services/minor-restoration',
  '/services/wallpaper',
  '/services/faux-finishes',
  '/services/colorconsult',
  '/services/faux-finishes/samples',
  '/portfolio',
  '/videos',
  '/team',
  '/reviews',
  '/contact',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getPortfolioCategories()
  const categoryRoutes = categories.map((category) => `/portfolio/${slugify(category)}`)
  const routes = [...STATIC_ROUTES, ...categoryRoutes]

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }))
}
