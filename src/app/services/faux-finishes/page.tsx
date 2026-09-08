import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Play } from 'lucide-react'
import { getServiceBySlug, getPortfolioProjectsByCategory } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import PortfolioCard from '@/components/portfolio-card'
import { Section } from '@/components/ui/section'
import { DRESSER_PROJECT_ID, WOOD_PANEL_PROJECT_ID } from '@/lib/faux-finishes-picks'

const SLUG = 'faux-finishes'
const CATEGORY = 'Faux Finishes'

export const metadata: Metadata = {
  title: 'Faux Finishes',
  description:
    'Custom faux finish and decorative painting techniques from The Proper Painter, a women-owned painting company serving Pittsburgh, PA.',
  alternates: { canonical: '/services/faux-finishes' },
}

export default async function FauxFinishesPage() {
  const [service, projects] = await Promise.all([
    getServiceBySlug(SLUG),
    getPortfolioProjectsByCategory(CATEGORY),
  ])

  const dresserProject = projects.find((p) => p._id === DRESSER_PROJECT_ID)
  const woodPanelProject = projects.find((p) => p._id === WOOD_PANEL_PROJECT_ID)

  return (
    <Section>
      {service?.heroImage && (
        <div className="relative mb-10 h-72 w-full border-b border-gray-800 md:h-[28rem]">
          <Image
            src={urlForImage(service.heroImage).width(1200).height(600).url()}
            alt={service.title}
            fill
            sizes="(min-width: 768px) 1152px, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <h1 className="text-4xl font-light tracking-tight md:text-5xl">
        {service?.title ?? 'Faux Finishes'}
      </h1>
      {service?.summary && (
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-400">{service.summary}</p>
      )}

      {(dresserProject || woodPanelProject) && (
        <div className="mt-16 border-t border-gray-800 pt-10 md:mt-20">
          <h2 className="text-2xl font-light tracking-tight">The Work</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
            className="mt-8 inline-block text-sm underline underline-offset-4 hover:text-gray-400"
          >
            See Sample Finishes
          </Link>
        </div>
      )}
    </Section>
  )
}
