import { getSiteSettings } from '@/lib/sanity/queries'
import { Section } from '@/components/ui/section'
import ContactForm from '@/components/contact-form'

export default async function ContactPage() {
  const settings = await getSiteSettings()

  return (
    <Section>
      <h1 className="text-4xl font-light tracking-tight md:text-5xl">Contact Us</h1>
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

        <ContactForm />
      </div>
    </Section>
  )
}
