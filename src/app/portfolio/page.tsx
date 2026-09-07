import type { Metadata } from 'next'
import Link from 'next/link'
import { getPortfolioProjects, getPortfolioCategories } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { Container } from '@/components/ui/section'
import { slugify } from '@/lib/slugify'

export const metadata: Metadata = {
  title: 'Portfolio',
  description:
    'Browse real before-and-after painting, wallpaper, cabinet, and restoration projects completed by The Proper Painter in Pittsburgh, PA.',
  alternates: { canonical: '/portfolio' },
}

// Matches the order services appear elsewhere on the site. Any category not
// listed here (e.g. one added later in Sanity) is appended after these, in
// the order Sanity returns it.
const CATEGORY_ORDER = [
  'Interior Painting',
  'Cabinet Painting',
  'Restoration',
  'Wallpaper',
  'Faux Finishes',
  'Color Consultation & Design',
]

function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a)
    const bi = CATEGORY_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

export default async function PortfolioPage() {
  const [projects, categoriesRaw] = await Promise.all([getPortfolioProjects(), getPortfolioCategories()])
  const categories = sortCategories(categoriesRaw)

  return (
    <>
      <Container>
        <div className="pt-16 pb-10 md:pt-24 md:pb-14">
          <h1 className="text-4xl font-light tracking-tight md:text-5xl">Portfolio</h1>
          <p className="mt-4 max-w-md text-lg text-gray-400">
            Our finest interiors, thoughtfully executed.
          </p>
        </div>
      </Container>

      {categories.map((category) => {
        const categoryProjects = projects.filter((p) => p.category === category)
        if (categoryProjects.length === 0) return null
        const preview = categoryProjects.slice(0, 4)
        const slug = slugify(category)

        return (
          <Container key={category}>
            <div className="border-t border-gray-800 py-12 md:py-16">
              <div className="flex items-baseline justify-between gap-6">
                <h2 className="text-2xl md:text-3xl">{category}</h2>
                <Link
                  href={`/portfolio/${slug}`}
                  className="shrink-0 text-sm underline underline-offset-4 hover:text-gray-400"
                >
                  See all {categoryProjects.length}
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                {preview.map((project, i) => {
                  // Faux Finishes source photos are texture swatches shot on a
                  // white mat, not room photos — object-cover would crop into
                  // that white border oddly, so show the whole swatch instead.
                  const isSwatch = category === 'Faux Finishes'
                  return (
                    <Link
                      key={i}
                      href={`/portfolio/${slug}`}
                      className={`block border border-gray-800 ${isSwatch ? 'bg-white' : ''}`}
                    >
                      {project.afterImage ? (
                        <img
                          src={
                            isSwatch
                              ? urlForImage(project.afterImage).width(500).url()
                              : urlForImage(project.afterImage).width(500).height(500).url()
                          }
                          alt={project.title}
                          className={`aspect-square w-full transition-opacity hover:opacity-90 ${isSwatch ? 'object-contain' : 'object-cover'}`}
                        />
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center bg-gray-900 text-xs text-gray-500">
                          {project.title}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </Container>
        )
      })}
    </>
  )
}
