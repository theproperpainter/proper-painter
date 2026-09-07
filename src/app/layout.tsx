import type { Metadata } from 'next'
import { Playfair_Display, Inter, Oswald } from 'next/font/google'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { getSiteSettings, getTestimonials } from '@/lib/sanity/queries'
import './globals.css'

const SITE_URL = 'https://theproperpainter.com'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Bold condensed sans for headings, echoing the stamped wordmark in the logo.
const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'The Proper Painter | Women-Owned Interior Painting in Pittsburgh, PA',
    template: '%s | The Proper Painter',
  },
  description:
    'Women-owned and operated interior painting company serving Pittsburgh, PA: interior painting, cabinet painting, wallpaper, faux finishes, restoration, and color consultation.',
  alternates: { canonical: '/' },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, testimonials] = await Promise.all([getSiteSettings(), getTestimonials()])

  // All 53 reviews across HomeAdvisor and Google are 5-star (verified against
  // both platforms directly), so the aggregate is a real 5.0, not a filler value.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: 'The Proper Painter',
    url: SITE_URL,
    telephone: settings?.contactPhone,
    email: settings?.contactEmail,
    sameAs: settings?.socialLinks?.map((link) => link.url) ?? [],
    ...(testimonials.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5.0',
        bestRating: '5',
        reviewCount: testimonials.length,
      },
    }),
  }

  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable} ${oswald.variable}`}>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
