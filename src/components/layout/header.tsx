import Link from 'next/link'
import { getSiteSettings } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/team', label: 'Team' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/contact', label: 'Contact' },
]

export default async function Header() {
  const settings = await getSiteSettings()

  return (
    <header className="relative z-50 border-b border-gray-800 bg-background">
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="relative z-50 flex items-center gap-3">
          {settings?.logo ? (
            <img
              src={urlForImage(settings.logo).width(160).height(160).url()}
              alt="The Proper Painter"
              className="h-16 w-auto object-contain grayscale"
            />
          ) : null}
          <span className="font-serif text-xl text-foreground">The Proper Painter</span>
        </Link>

        <ul className="hidden gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-foreground transition-colors hover:text-gray-400"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile menu: a full-screen takeover rather than a thin dropdown
            strip, so it feels like an intentional moment, not an afterthought. */}
        <details className="group md:hidden">
          <summary className="relative z-50 flex h-10 w-10 list-none items-center justify-center text-foreground">
            <button type="button" aria-label="Menu" className="pointer-events-none">
              <svg
                className="h-5 w-5 group-open:hidden"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path strokeLinecap="round" d="M2.5 5.5h15M2.5 10h15M2.5 14.5h15" />
              </svg>
              <svg
                className="hidden h-5 w-5 group-open:block"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path strokeLinecap="round" d="M4 4l12 12M16 4L4 16" />
              </svg>
            </button>
          </summary>
          <ul className="fixed inset-0 z-40 flex flex-col justify-center gap-1 bg-background px-8 pt-16">
            {NAV_LINKS.map((link) => (
              <li key={link.href} className="border-t border-gray-800 first:border-t-0">
                <Link
                  href={link.href}
                  className="block py-4 font-serif text-3xl text-foreground transition-colors hover:text-gray-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </nav>
    </header>
  )
}
