import { getSiteSettings } from '@/lib/sanity/queries'

export default async function Footer() {
  const settings = await getSiteSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-800 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="font-serif text-xl text-foreground">
          The Proper Painter — Women-Owned &amp; Operated, Fully Insured Licensed Contractor
        </p>

        <div className="mt-8 flex flex-col gap-6 border-t border-gray-800 pt-6 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          {(settings?.contactPhone || settings?.contactEmail) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {settings?.contactPhone && <span>{settings.contactPhone}</span>}
              {settings?.contactPhone && settings?.contactEmail && (
                <span aria-hidden="true" className="hidden h-3 w-px bg-gray-700 sm:inline-block" />
              )}
              {settings?.contactEmail && <span>{settings.contactEmail}</span>}
            </div>
          )}

          {settings?.socialLinks && settings.socialLinks.length > 0 && (
            <ul className="flex gap-6">
              {settings.socialLinks.map((link) => (
                <li key={link.platform}>
                  <a
                    href={link.url}
                    className="text-gray-400 transition-colors hover:text-foreground"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.platform}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-500">&copy; {year} The Proper Painter. All rights reserved.</p>
      </div>
    </footer>
  )
}
