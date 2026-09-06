import Link from 'next/link'
import { getAllServices, getTestimonials, getPortfolioProjects } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { Container } from '@/components/ui/section'
import ServiceRow from '@/components/service-row'

const ctaClass =
  'inline-block border border-foreground px-8 py-4 text-sm tracking-wide transition-colors hover:bg-foreground hover:text-background'

export default async function HomePage() {
  const [services, testimonials, projects] = await Promise.all([
    getAllServices(),
    getTestimonials(),
    getPortfolioProjects(),
  ])

  // Pinned to the spiral staircase photo per Elizabeth's request, rather than
  // whatever "first" portfolio project Sanity happens to return.
  const STAIRCASE_PROJECT_ID = 'U312e1WEeOlY6t2zsmXpaO'
  const staircaseProject = projects.find((p) => p._id === STAIRCASE_PROJECT_ID)
  const heroImage = staircaseProject?.afterImage ?? projects[0]?.afterImage ?? services[0]?.heroImage
  // Prefer a second, distinct project photo so the closing bookend never
  // repeats the image the visitor just saw in the last row of "The Work".
  const closingImage = projects[1]?.afterImage ?? projects[0]?.afterImage ?? services[0]?.heroImage

  return (
    <>
      {/* Hero: photo and headline live side by side on desktop — both visible
          together, nothing to scroll past to reach the call to action. */}
      <div className="flex flex-col border-y border-gray-800 md:h-[85vh] md:flex-row">
        <div className="md:w-1/2">
          {heroImage ? (
            <img
              src={urlForImage(heroImage).width(1600).height(1600).url()}
              alt=""
              className="h-[60vh] w-full object-cover md:h-full"
            />
          ) : (
            <div className="flex h-[60vh] w-full items-center justify-center bg-gray-900 text-gray-500 md:h-full">
              The Proper Painter
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-6 px-6 py-12 md:w-1/2 md:border-l md:border-gray-800 md:px-16">
          <h1 className="text-5xl leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            The Proper Painter
          </h1>
          <p className="max-w-sm font-serif text-xl leading-relaxed text-gray-400 italic md:text-2xl">
            Every room, painted properly — by a woman-owned crew that treats your home like
            their own.
          </p>
          <Link href="/contact" className={`${ctaClass} self-start text-red-500`}>
            Get a Quote
          </Link>
        </div>
      </div>

      {/* The Work: one full-width photo per service, in sequence, like walking a gallery hallway. */}
      <div className="mt-24 md:mt-32">
        <Container>
          <h2 className="text-3xl md:text-4xl">The Work</h2>
        </Container>

        <div className="mt-10 md:mt-14">
          {services.map((service) => (
            <ServiceRow key={service.slug.current} service={service} />
          ))}
        </div>
      </div>

      {/* Meet Elizabeth: kept quiet and plain — the photography carries the weight on this page. */}
      <Container>
        <div className="border-t border-gray-800 py-16 md:py-20">
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
        </div>
      </Container>

      {testimonials.length > 0 && (
        <Container>
          <div className="border-t border-gray-800 py-16 md:py-20">
            <h2 className="text-3xl md:text-4xl">What Clients Say</h2>
            <div className="mt-10">
              {testimonials.slice(0, 4).map((t, i) => (
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
          </div>
        </Container>
      )}

      {/* Closing: bookend the hero with a second full-bleed photo before the final call to action. */}
      <div className="mt-8 border-y border-gray-800 md:mt-10">
        {closingImage ? (
          <img
            src={urlForImage(closingImage).width(1920).height(1000).url()}
            alt=""
            className="h-[45vh] w-full object-cover md:h-[60vh]"
          />
        ) : (
          <div className="flex h-[45vh] w-full items-center justify-center bg-gray-900 text-gray-500 md:h-[60vh]" />
        )}
      </div>
      <Container>
        {/* A bordered card overlapping the photo's bottom edge — the card
            floats over the image, and scrolling reveals it tucking underneath. */}
        <div className="relative z-10 -mt-16 flex flex-col items-start gap-8 border border-gray-800 bg-background px-8 py-10 md:-mt-24 md:flex-row md:items-center md:justify-between md:px-12 md:py-14">
          <h2 className="max-w-lg text-3xl md:text-4xl">Your next room starts here.</h2>
          <Link href="/contact" className={ctaClass}>
            Contact Us
          </Link>
        </div>
      </Container>
    </>
  )
}
