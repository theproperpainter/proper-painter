import { getPortfolioProjects } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { Container } from '@/components/ui/section'

export default async function PortfolioPage() {
  const projects = await getPortfolioProjects()

  return (
    <>
      <Container>
        <div className="pt-16 pb-10 md:pt-24 md:pb-14">
          <h1 className="text-4xl font-light tracking-tight md:text-5xl">Portfolio</h1>
          <p className="mt-4 max-w-md text-lg text-gray-400">
            Our finest interiors, thoughtfully executed.
          </p>
        </div>
      </Container>
      <div>
        {projects.map((project, i) => (
          <div key={i} className="border-t border-gray-800">
            {project.afterImage ? (
              <img
                src={urlForImage(project.afterImage).width(1600).height(1200).url()}
                alt={project.title}
                className="h-[55vh] w-full object-cover md:h-[80vh]"
              />
            ) : (
              <div className="flex h-[55vh] w-full items-center justify-center bg-gray-900 text-gray-500 md:h-[80vh]">
                {project.title}
              </div>
            )}
            <Container>
              <div className="max-w-xl py-8 md:py-10">
                <h2 className="text-2xl md:text-3xl">{project.title}</h2>
                {project.description && (
                  <p className="mt-3 leading-relaxed text-gray-400">{project.description}</p>
                )}
              </div>
            </Container>
          </div>
        ))}
      </div>
    </>
  )
}
