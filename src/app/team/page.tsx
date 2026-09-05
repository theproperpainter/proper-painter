import { getTeamMember, getPortfolioProjects } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'

export default async function TeamPage() {
  const [member, projects] = await Promise.all([getTeamMember(), getPortfolioProjects()])
  // Fall back to a project photo until a real headshot is added in Sanity.
  const image = member?.photo ?? projects[2]?.afterImage ?? projects[0]?.afterImage

  return (
    <div className="flex flex-col md:flex-row md:items-stretch">
      <div className="order-2 flex flex-col justify-center px-6 py-16 md:order-1 md:w-1/2 md:px-16 md:py-24">
        {member ? (
          <>
            <h1 className="text-4xl font-light tracking-tight md:text-5xl">{member.name}</h1>
            {member.role && (
              <p className="mt-3 text-base font-light tracking-wide text-gray-500">{member.role}</p>
            )}
            {member.bio && (
              <p className="mt-8 max-w-md whitespace-pre-line leading-relaxed text-gray-400">
                {member.bio}
              </p>
            )}
          </>
        ) : (
          <h1 className="text-4xl font-light tracking-tight md:text-5xl">Our Team</h1>
        )}
      </div>
      <div className="order-1 md:order-2 md:w-1/2 md:border-l md:border-gray-800">
        {image ? (
          <img
            src={urlForImage(image).width(1200).height(1400).url()}
            alt={member?.name ?? ''}
            className="h-[50vh] w-full object-cover md:h-full md:min-h-[36rem]"
          />
        ) : (
          <div className="flex h-[50vh] w-full items-center justify-center bg-gray-900 text-gray-500 md:h-full md:min-h-[36rem]" />
        )}
      </div>
    </div>
  )
}
