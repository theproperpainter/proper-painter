import { sanityWriteClient } from './sanity-write-client'

// One-off script: removes the phone number from the live siteSettings
// document, at Elizabeth's request — only the contact email should remain
// public. The footer, /contact page, and the HomeAndConstructionBusiness
// structured data on layout.tsx all read `contactPhone` conditionally, so no
// code change is needed; they simply stop rendering a phone row once this
// field is gone.
//
// Uses patch().unset(), so it is safe to re-run (unsetting an already-absent
// field is a no-op).

async function main() {
  const settings = await sanityWriteClient.fetch<{ _id: string; contactPhone?: string } | null>(
    `*[_type == "siteSettings"][0]{_id, contactPhone}`
  )
  if (!settings) {
    throw new Error('No siteSettings document found.')
  }
  if (!settings.contactPhone) {
    console.log(`siteSettings ${settings._id} already has no contactPhone — nothing to do.`)
    return
  }

  await sanityWriteClient.patch(settings._id).unset(['contactPhone']).commit()
  console.log(`Removed contactPhone from siteSettings ${settings._id}.`)
}

if (typeof require !== 'undefined' && require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
