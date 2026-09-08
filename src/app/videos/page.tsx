import type { Metadata } from 'next'
import { getPortfolioProjectsByCategory } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { Section } from '@/components/ui/section'
import { WOOD_PANEL_PROJECT_ID } from '@/lib/faux-finishes-picks'

export const metadata: Metadata = {
  title: 'Videos',
  description:
    'See The Proper Painter’s faux finish techniques in action, including our faux wood grain painting process.',
  alternates: { canonical: '/videos' },
}

export default async function VideosPage() {
  const fauxFinishProjects = await getPortfolioProjectsByCategory('Faux Finishes')
  const woodPanelProject = fauxFinishProjects.find((p) => p._id === WOOD_PANEL_PROJECT_ID)
  const poster = woodPanelProject?.afterImage
    ? urlForImage(woodPanelProject.afterImage).width(1200).height(675).url()
    : undefined

  return (
    <Section>
      <h1 className="text-4xl font-light tracking-tight md:text-5xl">Videos</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-400">
        A closer look at the techniques behind our work.
      </p>

      <div className="mt-14 max-w-3xl border-t border-gray-800 pt-10">
        <h2 className="text-2xl font-light tracking-tight">Faux Wood Finish Painting</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-gray-400">
          What looks like a real wood panel is entirely hand-painted — watch how the grain
          is built up with brush and technique alone.
        </p>
        <video controls poster={poster} className="mt-6 w-full border border-gray-800 bg-black">
          <source src="/media/faux-wood-finish-demo.mp4" type="video/mp4" />
        </video>
      </div>
    </Section>
  )
}
