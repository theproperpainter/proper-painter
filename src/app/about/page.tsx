import { getPortfolioProjects, getAllServices } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'

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
            The Proper Painter is a women-owned and operated interior painting company,
            fully insured and licensed, built on a belief that craft and care go hand in hand.
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
