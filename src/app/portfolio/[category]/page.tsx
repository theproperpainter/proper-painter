import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Play } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getPortfolioProjectsByCategory, getPortfolioCategories } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { Container } from '@/components/ui/section'
import { slugify } from '@/lib/slugify'
import PortfolioCard from '@/components/portfolio-card'
import { DRESSER_PROJECT_ID, WOOD_PANEL_PROJECT_ID } from '@/lib/faux-finishes-picks'

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
  const isFauxFinishes = category === 'Faux Finishes'
  // The portfolio is real completed work, not the finish catalog — only the
  // dresser and wood-panel photos are actual projects; the rest are texture
  // swatches that belong on the Sample Finishes page instead.
  const dresserProject = projects.find((p) => p._id === DRESSER_PROJECT_ID)
  const woodPanelProject = projects.find((p) => p._id === WOOD_PANEL_PROJECT_ID)
  const fauxFinishesProjects = [dresserProject, woodPanelProject].filter(
    (p): p is NonNullable<typeof p> => Boolean(p)
  )

  return (
    <>
      <Container>
        <div className="pt-16 pb-10 md:pt-24 md:pb-14">
          <Link href="/portfolio" className="text-sm text-gray-400 underline underline-offset-4 hover:text-gray-300">
            &larr; All portfolio
          </Link>
          <h1 className="mt-4 text-4xl font-light tracking-tight md:text-5xl">{category}</h1>
          <p className="mt-2 text-gray-400">
            {isFauxFinishes ? fauxFinishesProjects.length : projects.length} photos
          </p>
        </div>
      </Container>
      {isFauxFinishes ? (
        // These source photos are texture swatches shot on a white mat, not
        // room photos — a full-bleed banner would either crop into that
        // white border or blow the swatch up far past its real size, so
        // show them as a plain grid instead, same as the service page.
        <Container>
          <div className="grid max-w-2xl gap-6 pb-8 sm:grid-cols-2">
            {woodPanelProject?.afterImage && (
              <Link
                href="/videos"
                className="group relative block h-64 border border-gray-800"
                aria-label="Watch the faux wood finish painting video"
              >
                <Image
                  src={urlForImage(woodPanelProject.afterImage).width(800).height(600).url()}
                  alt={woodPanelProject.title}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-opacity group-hover:opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
                    <Play className="h-6 w-6 translate-x-0.5 fill-black text-black" />
                  </span>
                </div>
              </Link>
            )}
            {dresserProject && <PortfolioCard project={dresserProject} variant="swatch" />}
          </div>
          <Link
            href="/services/faux-finishes/samples"
            className="inline-block pb-16 text-sm underline underline-offset-4 hover:text-gray-400 md:pb-24"
          >
            See Sample Finishes
          </Link>
        </Container>
      ) : (
        <div>
          {projects.map((project, i) => (
            <div key={i} className="border-t border-gray-800">
              {/* TODO: project.beforeImage is populated for at least one project
                  (a merged staircase before/after pair) but isn't displayed yet —
                  an earlier side-by-side treatment with "Before"/"After" labels
                  was removed because the two photos didn't align well visually,
                  making it unclear which was which. Revisit with a better layout. */}
              {project.afterImage ? (
                <div className="relative h-[55vh] w-full md:h-[80vh]">
                  <Image
                    src={(() => {
                      // Some source photos are far smaller than the standard
                      // 1080px+ originals (e.g. old phone photos). Forcing
                      // Sanity to upscale those to the usual 1600x1200 crop
                      // produces visible blur/pixelation in this large banner —
                      // cap the request at the source's native width instead so
                      // we never ask for more detail than the photo actually has.
                      const width = Math.min(1600, project.afterImageWidth ?? 1600)
                      const height = Math.round(width * 0.75)
                      return urlForImage(project.afterImage!).width(width).height(height).url()
                    })()}
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
