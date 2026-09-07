import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPortfolioProjectsByCategory, getPortfolioCategories } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { Container } from '@/components/ui/section'
import { slugify } from '@/lib/slugify'
import PortfolioCard from '@/components/portfolio-card'

export default async function PortfolioCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: slug } = await params
  const categories = await getPortfolioCategories()
  const category = categories.find((c) => slugify(c) === slug)

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
              {project.afterImage ? (
                <img
                  src={urlForImage(project.afterImage).width(1600).height(1200).url()}
                  alt={project.title}
                  className="h-[55vh] w-full object-cover md:h-[80vh]"
                />
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
