import { sanityWriteClient } from './sanity-write-client'

async function main() {
  const docs = await sanityWriteClient.fetch(
    `*[_type == "portfolioProject"]{_id, title, category, "afterAssetId": afterImage.asset->_id, "afterOriginalFilename": afterImage.asset->originalFilename, "beforeAssetId": beforeImage.asset->_id, "beforeOriginalFilename": beforeImage.asset->originalFilename}`
  )
  console.log(JSON.stringify(docs, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
