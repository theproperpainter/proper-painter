import { getAllServices } from '@/lib/sanity/queries'
import ServiceCard from '@/components/service-card'
import { Section } from '@/components/ui/section'

export default async function ServicesPage() {
  const services = await getAllServices()

  return (
    <Section>
      <h1 className="text-4xl font-light tracking-tight md:text-5xl">Our Services</h1>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.slug.current} service={service} />
        ))}
      </div>
    </Section>
  )
}
