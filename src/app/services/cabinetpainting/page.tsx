import { getServiceBySlug, getPortfolioProjectsByCategory } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import PortfolioCard from '@/components/portfolio-card'
import { Section } from '@/components/ui/section'

const SLUG = 'cabinetpainting'
const CATEGORY = 'Cabinet Painting'

export default async function CabinetPaintingPage() {
  const [service, projects] = await Promise.all([
    getServiceBySlug(SLUG),
    getPortfolioProjectsByCategory(CATEGORY),
  ])

  return (
    <Section>
      {service?.heroImage && (
        <img
          src={urlForImage(service.heroImage).width(1200).height(600).url()}
          alt={service.title}
          className="mb-10 h-72 w-full border-b border-gray-800 object-cover md:h-[28rem]"
        />
      )}
      <h1 className="text-4xl font-light tracking-tight md:text-5xl">
        {service?.title ?? 'Cabinet Painting'}
      </h1>
      {service?.summary && (
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-400">{service.summary}</p>
      )}

      {projects.length > 0 && (
        <div className="mt-16 border-t border-gray-800 pt-10 md:mt-20">
          <h2 className="text-2xl font-light tracking-tight">Recent Projects</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {projects.map((p, i) => (
              <PortfolioCard key={i} project={p} />
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}
