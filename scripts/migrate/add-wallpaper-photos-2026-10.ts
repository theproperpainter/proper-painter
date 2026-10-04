import { sanityWriteClient } from './sanity-write-client'
import { uploadLocalAsset } from './upload-assets'

// One-off script: adds 10 new wallpaper install photos (sent by the user
// 2026-10-03) as portfolioProject documents, category "Wallpaper". The
// existing service hero image is left untouched — these are additions to the
// "Recent Projects" gallery on /services/wallpaper, not a replacement.
//
// Idempotent: checks for an existing portfolioProject with the same title
// before creating one, per the guidance in README.md, so this is safe to
// re-run (e.g. if it fails partway through).

const DIR = 'C:\\Users\\El_Gu\\Downloads\\wallpaper pics'

const PHOTOS: { file: string; title: string }[] = [
  { file: 'IMG_3950.jpg', title: 'Botanical Fern Accent Wall' },
  { file: '2025-10-31 14.21.21.jpg', title: 'Abstract Ribbon Pattern Bedroom' },
  { file: 'IMG_1987.JPG', title: 'Terrazzo-Pattern Stairwell' },
  { file: 'IMG_3707.JPG', title: 'Textured Grasscloth Nook' },
  { file: 'IMG_3717.JPG', title: 'Damask Wallpaper Detail' },
  { file: 'IMG_3727.JPG', title: 'Illustrated Portrait Wallpaper Lounge' },
  { file: 'IMG_3766.JPG', title: 'Mid-Century Pattern Living Room' },
  { file: 'IMG_4001_converted.jpg', title: 'Wildflower Mural Wall' },
  { file: 'IMG_4708_converted.jpg', title: 'Poppy Floral Powder Room' },
  { file: 'IMG_8859_converted.jpg', title: 'Olive & Navy Stripe Wallpaper Detail' },
]

async function main() {
  for (const { file, title } of PHOTOS) {
    const existing = await sanityWriteClient.fetch<{ _id: string } | null>(
      `*[_type == "portfolioProject" && category == "Wallpaper" && title == $title][0]{_id}`,
      { title }
    )
    if (existing) {
      console.log(`SKIP (already exists): ${title}`)
      continue
    }

    const afterImage = await uploadLocalAsset(sanityWriteClient, {
      path: `${DIR}\\${file}`,
      alt: title,
    })

    const doc = await sanityWriteClient.create({
      _type: 'portfolioProject',
      title,
      category: 'Wallpaper',
      afterImage,
    })
    console.log(`Created: ${title} (${doc._id})`)
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
