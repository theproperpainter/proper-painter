import type { Testimonial } from '@/lib/sanity/queries'

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="border border-gray-800 p-6">
      <blockquote className="text-foreground">&ldquo;{testimonial.quote}&rdquo;</blockquote>
      <figcaption className="mt-4 text-sm text-gray-400">
        &mdash; {testimonial.author} <span className="text-gray-600">({testimonial.source})</span>
      </figcaption>
    </figure>
  )
}
