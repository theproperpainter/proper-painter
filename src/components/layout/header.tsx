import Image from 'next/image'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { NAV_LINKS } from './nav-links'
import MobileNav from './mobile-nav'

export default async function Header() {
  const settings = await getSiteSettings()

  return (
    <header className="relative z-50 border-b border-gray-800 bg-background">
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="relative z-50 flex items-center gap-3">
          {settings?.logo ? (
            <Image
              src={urlForImage(settings.logo).width(320).height(320).url()}
              alt="The Proper Painter"
              width={128}
              height={128}
              className="h-32 w-32 object-contain grayscale"
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
        <MobileNav />
      </nav>
    </header>
  )
}
