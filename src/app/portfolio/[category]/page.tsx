import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPortfolioProjectsByCategory, getPortfolioCategories } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { Container } from '@/components/ui/section'
import { slugify } from '@/lib/slugify'
import PortfolioCard from '@/components/portfolio-card'

async function resolveCategory(slug: string): Promise<string | undefined> {
  const categories = await getPortfolioCategories()
  return categories.find((c) => slugify(c) === slug)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category: slug } = await params
  const category = await resolveCategory(slug)

  if (!category) {
    return {}
  }

  return {
    title: `${category} Portfolio`,
    description: `Browse real ${category.toLowerCase()} project photos completed by The Proper Painter in Pittsburgh, PA.`,
    alternates: { canonical: `/portfolio/${slug}` },
  }
}

export default async function PortfolioCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: slug } = await params
  const category = await resolveCategory(slug)

  if (!category) {
    notFound()
  }

  const projects = await getPortfolioProjectsByCategory(category)

  return (
    <>
      <Container>
        <div className="pt-16 pb-10 md:pt-24 md:pb-14">
          <Link href="/portfolio" className="text-sm text-gray-400 underline underline-offset-4 hover:text-gray-300">
            &larr; All portfolio
          </Link>
          <h1 className="mt-4 text-4xl font-light tracking-tight md:text-5xl">{category}</h1>
          <p className="mt-2 text-gray-400">{projects.length} photos</p>
        </div>
      </Container>
      {category === 'Faux Finishes' ? (
        // These source photos are texture swatches shot on a white mat, not
        // room photos — a full-bleed banner would either crop into that
        // white border or blow the swatch up far past its real size, so
        // show them as a plain grid instead, same as the service page.
        <Container>
          <div className="grid gap-6 pb-16 sm:grid-cols-2 md:gap-8 md:pb-24 lg:grid-cols-3">
            {projects.map((project, i) => (
              <PortfolioCard key={i} project={project} variant="swatch" />
            ))}
          </div>
        </Container>
      ) : (
        <div>
          {projects.map((project, i) => (
            <div key={i} className="border-t border-gray-800">
              {project.beforeImage && project.afterImage ? (
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  <div className="relative h-[55vh] w-full sm:h-[80vh]">
                    <Image
                      src={urlForImage(project.beforeImage).width(1200).height(1600).url()}
                      alt={`${project.title} — before`}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                    <span className="absolute top-4 left-4 bg-background px-3 py-1 text-xs tracking-wide text-foreground uppercase">
                      Before
                    </span>
                  </div>
                  <div className="relative h-[55vh] w-full border-t border-gray-800 sm:h-[80vh] sm:border-t-0 sm:border-l">
                    <Image
                      src={urlForImage(project.afterImage).width(1200).height(1600).url()}
                      alt={`${project.title} — after`}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                    <span className="absolute top-4 left-4 bg-background px-3 py-1 text-xs tracking-wide text-foreground uppercase">
                      After
                    </span>
                  </div>
                </div>
              ) : project.afterImage ? (
                <div className="relative h-[55vh] w-full md:h-[80vh]">
                  <Image
                    src={urlForImage(project.afterImage).width(1600).height(1200).url()}
                    alt={project.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-[55vh] w-full items-center justify-center bg-gray-900 text-gray-500 md:h-[80vh]">
                  {project.title}
                </div>
              )}
              {project.description && (
                <Container>
                  <div className="max-w-xl py-8 md:py-10">
                    <p className="leading-relaxed text-gray-400">{project.description}</p>
                  </div>
                </Container>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
