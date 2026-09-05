/**
 * One-off corrective script for Finding 5 of the final whole-branch code review.
 *
 * A UI icon/tile image with alt="Interior Painting" (17 chars) passed the
 * `alt.length > 15` filter in seed-portfolio-and-services.ts and, because it was
 * processed before the real bathroom photo in the same category, became its own
 * spurious `portfolioProject` document AND claimed the `interior-painting`
 * service's `heroImage` slot.
 *
 * This script:
 *   1. Finds and deletes the spurious portfolioProject document
 *      (title == "Interior Painting").
 *   2. Finds the real bathroom portfolioProject document in the same category,
 *      and patches the `interior-painting` service's heroImage to that photo's
 *      afterImage value.
 *   3. Re-queries afterward to confirm the fix.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/migrate/fix-interior-painting-hero.ts
 */
import { sanityWriteClient } from './sanity-write-client'

interface PortfolioProjectDoc {
  _id: string
  title: string
  category: string
  afterImage?: { _type: 'image'; asset: { _type: 'reference'; _ref: string } }
}

interface ServiceDoc {
  _id: string
  slug: { current: string }
  heroImage?: { _type: 'image'; asset: { _type: 'reference'; _ref: string } }
}

async function main() {
  console.log('--- BEFORE ---')

  const spurious = await sanityWriteClient.fetch<PortfolioProjectDoc | null>(
    `*[_type == "portfolioProject" && title == "Interior Painting"][0]{_id, title, category, afterImage}`
  )
  console.log('Spurious "Interior Painting" portfolioProject:', JSON.stringify(spurious, null, 2))

  const service = await sanityWriteClient.fetch<ServiceDoc | null>(
    `*[_type == "service" && slug.current == "interior-painting"][0]{_id, slug, heroImage}`
  )
  console.log('interior-painting service (before):', JSON.stringify(service, null, 2))

  const realBathroom = await sanityWriteClient.fetch<PortfolioProjectDoc | null>(
    `*[_type == "portfolioProject" && category == "Interior Painting" && title != "Interior Painting"][0]{_id, title, category, afterImage}`
  )
  console.log('Real bathroom portfolioProject:', JSON.stringify(realBathroom, null, 2))

  if (!spurious) {
    throw new Error('BLOCKED: No portfolioProject document with title == "Interior Painting" found.')
  }
  if (!service) {
    throw new Error('BLOCKED: No service document with slug.current == "interior-painting" found.')
  }
  if (!realBathroom || !realBathroom.afterImage) {
    throw new Error(
      'BLOCKED: No real bathroom portfolioProject found (category "Interior Painting", title != "Interior Painting") with an afterImage.'
    )
  }

  // 2a. Delete the spurious document.
  await sanityWriteClient.delete(spurious._id)
  console.log(`Deleted spurious portfolioProject ${spurious._id}`)

  // 2b. Patch the service's heroImage to the real bathroom photo's afterImage.
  await sanityWriteClient.patch(service._id).set({ heroImage: realBathroom.afterImage }).commit()
  console.log(`Patched service ${service._id} heroImage to real bathroom photo's afterImage`)

  console.log('--- AFTER ---')

  const spuriousAfter = await sanityWriteClient.fetch<PortfolioProjectDoc | null>(
    `*[_type == "portfolioProject" && title == "Interior Painting"][0]{_id, title, category, afterImage}`
  )
  console.log('Spurious "Interior Painting" portfolioProject (should be null):', JSON.stringify(spuriousAfter, null, 2))

  const serviceAfter = await sanityWriteClient.fetch<ServiceDoc | null>(
    `*[_type == "service" && slug.current == "interior-painting"][0]{_id, slug, heroImage}`
  )
  console.log('interior-painting service (after):', JSON.stringify(serviceAfter, null, 2))

  const heroRef = serviceAfter?.heroImage?.asset._ref
  const bathroomRef = realBathroom.afterImage.asset._ref
  console.log(`heroImage._ref == real bathroom afterImage._ref: ${heroRef === bathroomRef} (${heroRef} vs ${bathroomRef})`)

  if (spuriousAfter) {
    throw new Error('VERIFICATION FAILED: spurious document still exists after delete.')
  }
  if (heroRef !== bathroomRef) {
    throw new Error('VERIFICATION FAILED: service heroImage does not match real bathroom photo asset ref.')
  }

  console.log('Verification passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
