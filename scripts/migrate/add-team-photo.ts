import { sanityWriteClient } from './sanity-write-client'
import { uploadAsset } from './upload-assets'

// One-off script: patches the existing teamMember document with a real photo
// of Elizabeth (a professional headshot recovered from the live site's home
// page — it was missed by the original crawl because it's lazy-loaded inside
// a carousel component that only renders real <img src> once scrolled into
// view, so the static crawler in crawl-assets.ts never saw it).
//
// Unlike seed-core-content.ts, this uses `patch()` on the existing document
// rather than `create()`, so it is safe to re-run — it will just overwrite
// the photo field with the same result.

const HEADSHOT_URL =
  'https://cdn.durable.co/blocks/1ePZUKSo587dVa6prq2h0dlHr9GSsk0b4OpkFsyDtm0JbscPv8KomjlhoApBSRd6.png'

async function main() {
  const teamMember = await sanityWriteClient.fetch<{ _id: string } | null>(
    `*[_type == "teamMember"][0]{_id}`
  )
  if (!teamMember) {
    throw new Error('No teamMember document found — expected the one created by seed-core-content.ts')
  }

  const photo = await uploadAsset(sanityWriteClient, {
    url: HEADSHOT_URL,
    alt: 'Elizabeth Best',
  })

  await sanityWriteClient.patch(teamMember._id).set({ photo }).commit()
  console.log(`Patched teamMember ${teamMember._id} with a real photo`)
}

if (typeof require !== 'undefined' && require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
