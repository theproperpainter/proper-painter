import { urlForImage } from '@/lib/sanity/image'
import type { PortfolioProject } from '@/lib/sanity/queries'

interface PortfolioCardProps {
  project: PortfolioProject
  // Faux-finish source photos are texture swatches shot on a white mat, not
  // room photos — cropping them with object-cover just crops into that white
  // border oddly. "swatch" shows the whole photo uncropped on a matching
  // white ground instead of forcing it to fill a black card.
  variant?: 'photo' | 'swatch'
}

export default function PortfolioCard({ project, variant = 'photo' }: PortfolioCardProps) {
  const isSwatch = variant === 'swatch'
  // Swatches keep their native aspect ratio (no forced 4:3 crop) so
  // object-contain can show the whole thing without cutting into it.
  const imageUrl = isSwatch
    ? urlForImage(project.afterImage!).width(800).url()
    : urlForImage(project.afterImage!).width(800).height(600).url()

  return (
    <figure className={`border border-gray-800 ${isSwatch ? 'bg-white' : ''}`}>
      {project.afterImage && (
        <img
          src={imageUrl}
          alt={project.title}
          className={`h-64 w-full ${isSwatch ? 'object-contain' : 'object-cover'}`}
        />
      )}
    </figure>
  )
}
