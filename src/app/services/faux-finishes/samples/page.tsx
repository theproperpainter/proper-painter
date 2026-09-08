import type { Metadata } from 'next'
import Link from 'next/link'
import { getPortfolioProjectsByCategory } from '@/lib/sanity/queries'
import PortfolioCard from '@/components/portfolio-card'
import { Section } from '@/components/ui/section'
import { DRESSER_PROJECT_ID, WOOD_PANEL_PROJECT_ID } from '@/lib/faux-finishes-picks'

const CATEGORY = 'Faux Finishes'

export const metadata: Metadata = {
  title: 'Sample Finishes',
  description:
    'Browse available faux finish samples from The Proper Painter, a women-owned painting company serving Pittsburgh, PA.',
  alternates: { canonical: '/services/faux-finishes/samples' },
}

export default async function FauxFinishesSamplesPage() {
  const projects = await getPortfolioProjectsByCategory(CATEGORY)
  const samples = projects.filter(
    (p) => p._id !== DRESSER_PROJECT_ID && p._id !== WOOD_PANEL_PROJECT_ID
  )

  return (
    <Section>
      <Link
        href="/services/faux-finishes"
        className="text-sm underline underline-offset-4 hover:text-gray-400"
      >
        &larr; Back to Faux Finishes
      </Link>
      <h1 className="mt-5 text-4xl font-light tracking-tight md:text-5xl">Sample Finishes</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-400">
        A look at the range of faux finish textures and colors available. Every sample can be
        customized to your space.
      </p>

      {samples.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {samples.map((p) => (
            <PortfolioCard key={p._id} project={p} variant="swatch" />
          ))}
        </div>
      )}
    </Section>
  )
}
