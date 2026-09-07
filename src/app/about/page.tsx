import type { Metadata } from 'next'
import { getPortfolioProjects, getAllServices } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    "Meet The Proper Painter, a women-owned and operated interior painting company in Pittsburgh, PA, founded by architectural designer Elizabeth Best.",
  alternates: { canonical: '/about' },
}

export default async function AboutPage() {
  const [projects, services] = await Promise.all([getPortfolioProjects(), getAllServices()])
  // A different project photo than the one used on the home page hero, so
  // returning visitors see a new room here rather than a repeat.
  const image = projects[1]?.afterImage ?? services[0]?.heroImage

  return (
    <div className="flex flex-col md:flex-row md:items-stretch">
      <div className="order-2 flex flex-col justify-center px-6 py-16 md:order-1 md:w-1/2 md:px-16 md:py-24">
        <h1 className="text-4xl font-light tracking-tight md:text-5xl">
          About The Proper Painter
        </h1>
        <div className="mt-8 max-w-md space-y-6">
          <p className="text-base leading-relaxed text-gray-300">
            The Proper Painter is a women-owned and operated interior painting company serving
            the Pittsburgh Metropolitan Area, fully insured and licensed, built on a belief that
            craft and care go hand in hand.
          </p>
          <p className="text-base leading-relaxed text-gray-300">
            Founded by Elizabeth Best, an architectural designer by training, the business is guided by a
            mission that goes beyond painting walls: fostering and inspiring other women to
            enter the trades, proving that skilled, hands-on work is for anyone willing to do
            it properly.
          </p>
          <p className="pt-4 text-base italic leading-relaxed text-gray-400">
            &ldquo;If it&rsquo;s worth doing, do your best.&rdquo;
          </p>
        </div>

        <div className="mt-10 max-w-md border-t border-gray-800 pt-8">
          <p className="text-xs tracking-wide text-gray-500 uppercase">Proud member of</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <a
              href="https://pghhomebuilders.com/"
              target="_blank"
              rel="noreferrer"
              className="flex h-16 w-28 items-center justify-center bg-white p-2 transition-opacity hover:opacity-80"
            >
              <img
                src="/affiliations/bamp.png"
                alt="Builders Association of Metropolitan Pittsburgh (BAMP)"
                className="max-h-full max-w-full object-contain"
              />
            </a>
            <a
              href="https://pabuilders.org/about/professional-women-in-building/"
              target="_blank"
              rel="noreferrer"
              className="flex h-16 w-28 items-center justify-center bg-white p-2 transition-opacity hover:opacity-80"
            >
              <img
                src="/affiliations/pwb.png"
                alt="PA Professional Women in Building (PWB)"
                className="max-h-full max-w-full object-contain"
              />
            </a>
            <a
              href="https://paw.asid.org/"
              target="_blank"
              rel="noreferrer"
              className="flex h-16 w-28 items-center justify-center border border-gray-800 bg-black p-2 transition-opacity hover:opacity-80"
            >
              <img
                src="/affiliations/asid.svg"
                alt="American Society of Interior Designers (ASID)"
                className="max-h-full max-w-full object-contain"
              />
            </a>
          </div>
        </div>
      </div>
      <div className="order-1 md:order-2 md:w-1/2 md:border-l md:border-gray-800">
        {image ? (
          <img
            src={urlForImage(image).width(1200).height(1400).url()}
            alt=""
            className="h-[50vh] w-full object-cover md:h-full md:min-h-[36rem]"
          />
        ) : (
          <div className="flex h-[50vh] w-full items-center justify-center bg-gray-900 text-gray-500 md:h-full md:min-h-[36rem]" />
        )}
      </div>
    </div>
  )
}
