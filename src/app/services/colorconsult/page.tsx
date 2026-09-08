import type { Metadata } from 'next'
import { getServiceBySlug } from '@/lib/sanity/queries'
import { Section } from '@/components/ui/section'

const SLUG = 'colorconsult'

export const metadata: Metadata = {
  title: 'Color Consultation & Design',
  description:
    'Expert color consultation and design services from The Proper Painter, a women-owned painting company serving Pittsburgh, PA.',
  alternates: { canonical: '/services/colorconsult' },
}

export default async function ColorConsultPage() {
  const service = await getServiceBySlug(SLUG)

  return (
    <Section>
      <h1 className="text-4xl font-light tracking-tight md:text-5xl">
        {service?.title ?? 'Color Consultation'}
      </h1>
      {service?.summary && (
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-400">{service.summary}</p>
      )}
    </Section>
  )
}
