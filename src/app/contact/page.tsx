import { getSiteSettings } from '@/lib/sanity/queries'
import { Section } from '@/components/ui/section'

const fieldClass =
  'mt-1 w-full border-b border-gray-800 bg-transparent py-2 text-foreground placeholder:text-gray-600 focus:border-foreground focus:outline-none transition-colors'

const labelClass = 'block text-sm text-gray-500'

export default async function ContactPage() {
  const settings = await getSiteSettings()

  return (
    <Section>
      <h1 className="text-5xl font-light tracking-tight">Contact Us</h1>
      <p className="mt-4 max-w-md leading-relaxed text-gray-400">
        Tell us about your rooms and your timeline. We reply personally, usually within a
        business day.
      </p>

      <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <h2 className="text-sm text-gray-500">Get in touch</h2>
          <dl className="mt-4">
            {settings?.contactPhone && (
              <div className="flex items-baseline justify-between border-b border-gray-800 py-3">
                <dt className="text-xs text-gray-500">Phone</dt>
                <dd className="text-base">{settings.contactPhone}</dd>
              </div>
            )}
            {settings?.contactEmail && (
              <div className="flex items-baseline justify-between border-b border-gray-800 py-3">
                <dt className="text-xs text-gray-500">Email</dt>
                <dd className="text-base">{settings.contactEmail}</dd>
              </div>
            )}
          </dl>
        </div>

        <form className="space-y-6 md:border-l md:border-gray-800 md:pl-16">
          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input id="name" name="name" type="text" autoComplete="name" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input id="email" name="email" type="email" autoComplete="email" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="message" className={labelClass}>
              Message
            </label>
            <textarea id="message" name="message" rows={4} className={`${fieldClass} resize-none`} />
          </div>
          <button
            type="submit"
            className="mt-2 inline-block w-full border border-foreground px-8 py-3 text-sm tracking-wide transition-colors hover:bg-foreground hover:text-background sm:w-auto"
          >
            Send message
          </button>
        </form>
      </div>
    </Section>
  )
}
