import Link from 'next/link'
import { urlForImage } from '@/lib/sanity/image'
import { Container } from '@/components/ui/section'
import type { Service } from '@/lib/sanity/queries'

export default function ServiceRow({ service }: { service: Service }) {
  return (
    <div className="border-t border-gray-800">
      <Link href={`/services/${service.slug.current}`} className="block">
        {service.heroImage ? (
          <img
            src={urlForImage(service.heroImage).width(1600).height(900).url()}
            alt={service.title}
            className="h-[45vh] w-full object-cover transition-opacity hover:opacity-90 md:h-[70vh]"
          />
        ) : (
          <div className="flex h-[45vh] w-full items-center justify-center bg-gray-900 text-gray-500 md:h-[70vh]">
            {service.title}
          </div>
        )}
      </Link>
      <Container>
        <div className="max-w-xl py-8 md:py-10">
          <h3 className="text-2xl md:text-3xl">{service.title}</h3>
          {service.summary && <p className="mt-3 leading-relaxed text-gray-400">{service.summary}</p>}
          <Link
            href={`/services/${service.slug.current}`}
            className="mt-4 inline-block text-sm underline underline-offset-4 hover:text-gray-400"
          >
            See the work
          </Link>
        </div>
      </Container>
    </div>
  )
}
