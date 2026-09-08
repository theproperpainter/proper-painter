import Image from 'next/image'
import Link from 'next/link'
import { urlForImage } from '@/lib/sanity/image'
import { Container } from '@/components/ui/section'
import type { Service } from '@/lib/sanity/queries'

export default function ServiceRow({ service }: { service: Service }) {
  // Color Consultation has no project photos of its own (by design — the
  // service page shows only the summary), so "See the work" would link to a
  // page with nothing to see.
  const hasWork = service.slug.current !== 'colorconsult'

  return (
    <div className="border-t border-gray-800">
      <Link href={`/services/${service.slug.current}`} className="relative block h-[45vh] md:h-[70vh]">
        {service.heroImage ? (
          <Image
            src={urlForImage(service.heroImage).width(1600).height(900).url()}
            alt={service.title}
            fill
            sizes="100vw"
            className="object-cover transition-opacity hover:opacity-90"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-500">
            {service.title}
          </div>
        )}
      </Link>
      <Container>
        <div className="max-w-xl py-8 md:py-10">
          <h3 className="text-2xl md:text-3xl">{service.title}</h3>
          {service.summary && <p className="mt-3 leading-relaxed text-gray-400">{service.summary}</p>}
          {hasWork && (
            <Link
              href={`/services/${service.slug.current}`}
              className="mt-4 inline-block text-sm underline underline-offset-4 hover:text-gray-400"
            >
              See the work
            </Link>
          )}
        </div>
      </Container>
    </div>
  )
}
