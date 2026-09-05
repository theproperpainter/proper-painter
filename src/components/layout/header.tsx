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
    <header className="border-b border-gray-800 bg-background">
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          {settings?.logo ? (
            <img
              src={urlForImage(settings.logo).width(96).height(96).url()}
              alt="The Proper Painter"
              className="h-10 w-auto object-contain grayscale"
            />
          ) : null}
          <span className="font-serif text-xl text-foreground">The Proper Painter</span>
        </Link>

        <ul hidden className="gap-8 md:flex">
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

        <details className="group md:hidden">
          <summary className="flex h-10 w-10 list-none items-center justify-center text-foreground">
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
          <ul className="absolute top-full right-0 left-0 flex flex-col border-b border-gray-800 bg-background px-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href} className="border-t border-gray-800 first:border-t-0">
                <Link
                  href={link.href}
                  className="block py-3 text-sm text-foreground transition-colors hover:text-gray-400"
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
