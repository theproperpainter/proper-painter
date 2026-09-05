import { readFileSync } from 'fs'
import path from 'path'
import { sanityWriteClient } from './sanity-write-client'
import { uploadAsset, type ImageFieldValue } from './upload-assets'
import { reviews, type Review } from './reviews-data'

interface CrawledAsset {
  url: string
  alt: string
  sourcePage: string
}

export function buildTestimonialDocs(reviewList: Review[]) {
  return reviewList.map((review) => ({
    _type: 'testimonial' as const,
    quote: review.quote,
    author: review.author,
    source: review.source,
  }))
}

export function buildSiteSettingsDoc(logo: ImageFieldValue) {
  return {
    _type: 'siteSettings' as const,
    _id: 'siteSettings',
    contactPhone: '412-427-6873',
    contactEmail: 'theproperpainterllc@gmail.com',
    logo,
    socialLinks: [
      { platform: 'HomeAdvisor', url: 'https://www.homeadvisor.com/rated.TheProperPainterLLC.118848373.html' },
      { platform: 'Facebook', url: 'https://facebook.com/theproperpainterllc' },
      { platform: 'Instagram', url: 'https://instagram.com/theproperpainterllc' },
      { platform: 'Google Reviews', url: 'https://g.page/r/CQ7RtRHDEUczEAE/review' },
    ],
  }
}

export function buildTeamMemberDoc() {
  return {
    _type: 'teamMember' as const,
    name: 'Elizabeth Best',
    role: 'Owner, M. Arch',
    bio: "I am passionate about creating amazing spaces! I have always worked with my hands and consider myself a craftswoman to the core. It all started when I was young, building dollhouses. Those dollhouses got me a scholarship to the Savannah College of Art & Design, School of Building Arts. After 5 years of intensive study, I graduated with both a Master's and Bachelor's Degrees in Architecture. My creative energy leads the way. I'm an enthusiastic entrepreneur who is not afraid of reinvention. I'm proud to say that I am a Mother, Professional Painter, Craftswoman, Designer, Employer, US Patent Holder, and much more! Moving into the future, I want my business model to center around fostering and inspiring other women to enter the trades.",
  }
}

async function findAndUploadLogo(): Promise<ImageFieldValue> {
  const manifestPath = path.join(__dirname, 'crawled-assets.json')
  const assets: CrawledAsset[] = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  const logoAsset = assets.find((a) => a.alt === 'The Proper Painter, LLC')
  if (!logoAsset) {
    throw new Error(
      'Could not find the logo image (alt="The Proper Painter, LLC") in crawled-assets.json. Re-run Task 4\'s crawler, or check whether the live site changed its logo alt text.'
    )
  }
  return uploadAsset(sanityWriteClient, logoAsset)
}

async function main() {
  const testimonialDocs = buildTestimonialDocs(reviews)
  for (const doc of testimonialDocs) {
    await sanityWriteClient.create(doc)
  }
  console.log(`Created ${testimonialDocs.length} testimonial documents`)

  const logo = await findAndUploadLogo()
  await sanityWriteClient.createOrReplace(buildSiteSettingsDoc(logo))
  console.log('Created/updated siteSettings document (including real logo)')

  await sanityWriteClient.create(buildTeamMemberDoc())
  console.log('Created teamMember document for Elizabeth')
}

// Guarded with `typeof require` so this file can be safely imported by tests
// (which run under Jest's ESM mode, where `require` is not a global) while
// still running `main()` when executed directly via `tsx` (CommonJS).
if (typeof require !== 'undefined' && require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
