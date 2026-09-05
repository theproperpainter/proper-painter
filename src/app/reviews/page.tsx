import { getTestimonials } from '@/lib/sanity/queries'
import { Container } from '@/components/ui/section'

export default async function ReviewsPage() {
  const testimonials = await getTestimonials()

  return (
    <Container>
      <div className="pt-16 pb-10 md:pt-24 md:pb-14">
        <h1 className="text-4xl font-light tracking-tight md:text-5xl">Client Reviews</h1>
        <p className="mt-2 text-gray-400">{testimonials.length} reviews from real clients.</p>
      </div>
      <div className="pb-16 md:pb-24">
        {testimonials.map((t, i) => (
          <div key={i} className="border-t border-gray-800 py-8 first:border-t-0 md:py-10">
            <blockquote className="max-w-2xl text-xl leading-relaxed md:text-2xl">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <p className="mt-4 text-sm text-gray-500">
              &mdash; {t.author} ({t.source})
            </p>
          </div>
        ))}
      </div>
    </Container>
  )
}
