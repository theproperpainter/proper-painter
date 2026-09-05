import { readFileSync } from 'fs'
import path from 'path'
import { sanityWriteClient } from './sanity-write-client'
import { uploadAsset, type ImageFieldValue } from './upload-assets'
import { inferCategory } from './categorize'

interface CrawledAsset {
  url: string
  alt: string
  sourcePage: string
}

// The site's logo image (Task 6's `findAndUploadLogo` already uploaded this and set
// it as `siteSettings.logo`). Its alt text is 23 characters, so it would otherwise
// pass the `alt.length > 15` "real photography" filter below and get miscategorized
// as a portfolio project (falling through `inferCategory` to "Interior Painting").
// Exclude it explicitly so this script only ever creates portfolioProject documents
// for actual project photos, not the company logo.
const LOGO_ALT = 'The Proper Painter, LLC'

const SERVICES: { category: string; slug: string; title: string }[] = [
  { category: 'Interior Painting', slug: 'interior-painting', title: 'Interior Painting' },
  { category: 'Cabinet Painting', slug: 'cabinetpainting', title: 'Cabinet Painting' },
  { category: 'Restoration', slug: 'minor-restoration', title: 'Restoration' },
  { category: 'Wallpaper & Faux Finishes', slug: 'wallpaper', title: 'Wallpaper & Faux Finishes' },
]

async function upsertServiceHeroImage(category: string, image: ImageFieldValue) {
  const serviceMeta = SERVICES.find((s) => s.category === category)
  if (!serviceMeta) return // e.g. "Color Consultation" has no photo category mapping in this pass

  const existing = await sanityWriteClient.fetch<{ _id: string; heroImage?: unknown } | null>(
    `*[_type == "service" && slug.current == $slug][0]{_id, heroImage}`,
    { slug: serviceMeta.slug }
  )

  if (existing) {
    if (!existing.heroImage) {
      await sanityWriteClient.patch(existing._id).set({ heroImage: image }).commit()
    }
    return
  }

  // Service document doesn't exist yet (Site Foundation only registered the schema
  // type, not any content) — create it now with the real title/slug/heroImage.
  await sanityWriteClient.create({
    _type: 'service',
    title: serviceMeta.title,
    slug: { _type: 'slug', current: serviceMeta.slug },
    heroImage: image,
  })
}

async function main() {
  const manifestPath = path.join(__dirname, 'crawled-assets.json')
  const assets: CrawledAsset[] = JSON.parse(readFileSync(manifestPath, 'utf-8'))

  // Only migrate real photography (has meaningful alt text, not icons/logos).
  // The logo is excluded explicitly — see LOGO_ALT comment above.
  const photoAssets = assets.filter((a) => a.alt && a.alt.length > 15 && a.alt !== LOGO_ALT)

  // The crawl (Task 4) revisits the same photo across multiple page headers/footers
  // and page bodies, producing duplicate entries with identical urls. Dedupe by url
  // (keep the first occurrence) so we don't create duplicate Sanity assets and
  // duplicate portfolioProject documents for the same underlying photo.
  //
  // Note: `new Map(entries)` keeps the LAST value written for a repeated key (each
  // repeated `.set()` overwrites the previous value), not the first — so we can't
  // just do `new Map(photoAssets.map((a) => [a.url, a]))` and call it "first
  // occurrence". Build the map by hand, skipping urls already seen, to actually keep
  // the first occurrence (e.g. the kitchen photo's alt differs slightly between its
  // "/" and "/team" appearances — we want the earlier one).
  const seenUrls = new Map<string, CrawledAsset>()
  for (const asset of photoAssets) {
    if (!seenUrls.has(asset.url)) {
      seenUrls.set(asset.url, asset)
    }
  }
  const uniquePhotoAssets = Array.from(seenUrls.values())

  let projectCount = 0
  for (const asset of uniquePhotoAssets) {
    const category = inferCategory(asset.alt)
    const image = await uploadAsset(sanityWriteClient, asset)

    await sanityWriteClient.create({
      _type: 'portfolioProject',
      title: asset.alt,
      category,
      afterImage: image,
      description: asset.alt,
    })
    projectCount++

    await upsertServiceHeroImage(category, image)
  }

  console.log(`Created ${projectCount} portfolio project documents and created/updated matching service documents`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
