import { getTestimonials } from '@/lib/sanity/queries'
import TestimonialCard from '@/components/testimonial-card'
import { Section } from '@/components/ui/section'

export default async function ReviewsPage() {
  const testimonials = await getTestimonials()

  return (
    <Section>
      <h1 className="text-4xl font-light tracking-tight md:text-5xl">Client Reviews</h1>
      <p className="mt-2 text-gray-400">{testimonials.length} reviews from real clients.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <TestimonialCard key={i} testimonial={t} />
        ))}
      </div>
    </Section>
  )
}
