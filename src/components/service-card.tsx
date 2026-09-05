import Link from 'next/link'
import { urlForImage } from '@/lib/sanity/image'
import type { Service } from '@/lib/sanity/queries'

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services/${service.slug.current}`}
      className="group block border border-gray-800 transition-colors hover:border-gray-600"
    >
      {service.heroImage ? (
        <img
          src={urlForImage(service.heroImage).width(600).height(400).url()}
          alt={service.title}
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-gray-900 text-gray-500">
          {service.title}
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg">{service.title}</h3>
        {service.summary && <p className="mt-1 text-sm text-gray-400">{service.summary}</p>}
      </div>
    </Link>
  )
}
