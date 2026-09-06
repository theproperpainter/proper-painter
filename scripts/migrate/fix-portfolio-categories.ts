import { sanityWriteClient } from './sanity-write-client'

// One-off fix: the service detail pages (services/minor-restoration,
// services/wallpaper) filter portfolioProject.category by the exact
// strings 'Restoration' and 'Wallpaper & Faux Finishes' (an intentional
// merge decision made in an earlier task, combining the live site's more
// granular categories into this app's 5-service structure). The bulk
// carousel migration (add-portfolio-carousel-images.ts) used the live
// site's own finer-grained category names instead, so those new documents
// were invisible to the service pages' "Recent Projects" queries. This
// renames them to match. Safe to re-run — patches by category match, not
// by document id.

const RENAMES: Record<string, string> = {
  'Minor Restoration': 'Restoration',
  Wallpaper: 'Wallpaper & Faux Finishes',
  'Faux Finishes': 'Wallpaper & Faux Finishes',
}

async function main() {
  for (const [from, to] of Object.entries(RENAMES)) {
    const ids = await sanityWriteClient.fetch<string[]>(
      `*[_type == "portfolioProject" && category == $from]._id`,
      { from }
    )
    if (ids.length === 0) {
      console.log(`No documents with category "${from}"`)
      continue
    }
    const tx = sanityWriteClient.transaction()
    for (const id of ids) {
      tx.patch(id, (p) => p.set({ category: to }))
    }
    await tx.commit()
    console.log(`Renamed ${ids.length} documents: "${from}" -> "${to}"`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
