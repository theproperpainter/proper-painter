import Link from 'next/link'
import { getAllServices, getTestimonials } from '@/lib/sanity/queries'
import ServiceCard from '@/components/service-card'
import TestimonialCard from '@/components/testimonial-card'
import { Section } from '@/components/ui/section'

const ctaClass =
  'inline-block border border-foreground px-8 py-4 text-sm tracking-wide transition-colors hover:bg-foreground hover:text-background'

export default async function HomePage() {
  const [services, testimonials] = await Promise.all([getAllServices(), getTestimonials()])
  const featuredTestimonials = testimonials.slice(0, 4)

  return (
    <>
      <Section className="py-24 md:py-36 lg:py-44">
        <h1 className="max-w-3xl text-5xl leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
          The Proper Painter
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400 md:text-xl">
          Women-owned and operated interior painting, right in your neighborhood.
        </p>
        <Link href="/contact" className={`mt-10 ${ctaClass}`}>
          Get a Quote
        </Link>
      </Section>

      <Section className="border-t border-gray-800">
        <h2 className="text-3xl md:text-4xl">Our Services</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.slug.current} service={service} />
          ))}
        </div>
      </Section>

      <Section className="border-t border-gray-800">
        <h2 className="text-3xl md:text-4xl">Meet Elizabeth</h2>
        <p className="mt-4 max-w-xl leading-relaxed text-gray-400">
          A woman-owned business built on craft, care, and a mission to bring more women into
          the trades.
        </p>
        <Link
          href="/team"
          className="mt-5 inline-block text-sm underline underline-offset-4 hover:text-gray-400"
        >
          Learn more about our team
        </Link>
      </Section>

      {featuredTestimonials.length > 0 && (
        <Section className="border-t border-gray-800">
          <h2 className="text-3xl md:text-4xl">What Clients Say</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {featuredTestimonials.map((t, i) => (
              <TestimonialCard key={i} testimonial={t} />
            ))}
          </div>
        </Section>
      )}

      <Section className="border-t border-gray-800 py-24 text-center md:py-32">
        <h2 className="text-3xl md:text-4xl">Ready to Transform Your Space?</h2>
        <Link href="/contact" className={`mt-8 ${ctaClass}`}>
          Contact Us
        </Link>
      </Section>
    </>
  )
}
