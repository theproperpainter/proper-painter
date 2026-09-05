import { getAllServices } from '@/lib/sanity/queries'
import ServiceRow from '@/components/service-row'
import { Container } from '@/components/ui/section'

export default async function ServicesPage() {
  const services = await getAllServices()

  return (
    <>
      <Container>
        <div className="pt-16 pb-10 md:pt-24 md:pb-14">
          <h1 className="text-4xl font-light tracking-tight md:text-5xl">Our Services</h1>
          <p className="mt-4 max-w-md text-lg text-gray-400">
            Every job, done properly — see the work behind each one.
          </p>
        </div>
      </Container>
      <div>
        {services.map((service) => (
          <ServiceRow key={service.slug.current} service={service} />
        ))}
      </div>
    </>
  )
}
