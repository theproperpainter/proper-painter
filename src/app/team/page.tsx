import { getTeamMember } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { Section } from '@/components/ui/section'

export default async function TeamPage() {
  const member = await getTeamMember()

  return (
    <Section>
      {member ? (
        <div className="max-w-2xl">
          {member.photo && (
            <img
              src={urlForImage(member.photo).width(300).height(300).url()}
              alt={member.name}
              className="mb-8 h-40 w-40 rounded-full object-cover"
            />
          )}
          <h1 className="text-4xl font-light tracking-tight md:text-5xl">{member.name}</h1>
          {member.role && (
            <p className="mt-3 text-base text-gray-500 font-light tracking-wide">{member.role}</p>
          )}
          {member.bio && (
            <div className="mt-8">
              <p className="whitespace-pre-line text-gray-400 leading-relaxed">{member.bio}</p>
            </div>
          )}
        </div>
      ) : (
        <h1 className="text-4xl font-light tracking-tight md:text-5xl">Our Team</h1>
      )}
    </Section>
  )
}
