import { getPortfolioProjects } from '@/lib/sanity/queries'
import PortfolioCard from '@/components/portfolio-card'
import { Section } from '@/components/ui/section'

export default async function PortfolioPage() {
  const projects = await getPortfolioProjects()

  return (
    <Section>
      <div className="mb-12">
        <h1 className="text-4xl">Portfolio</h1>
        <p className="mt-4 text-lg text-gray-600">Our finest interiors, thoughtfully executed.</p>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
        {projects.map((p, i) => (
          <PortfolioCard key={i} project={p} />
        ))}
      </div>
    </Section>
  )
}
