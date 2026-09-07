import { urlForImage } from '@/lib/sanity/image'
import type { PortfolioProject } from '@/lib/sanity/queries'

export default function PortfolioCard({ project }: { project: PortfolioProject }) {
  return (
    <figure className="border border-gray-800">
      {project.afterImage && (
        <img
          src={urlForImage(project.afterImage).width(800).height(600).url()}
          alt={project.title}
          className="h-64 w-full object-cover"
        />
      )}
    </figure>
  )
}
