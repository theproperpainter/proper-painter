import type { SanityClient } from '@sanity/client'

export interface ImageFieldValue {
  _type: 'image'
  asset: { _type: 'reference'; _ref: string }
}

export async function uploadAsset(
  client: SanityClient,
  asset: { url: string; alt: string }
): Promise<ImageFieldValue> {
  const response = await fetch(asset.url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const filename = asset.url.split('/').pop() || 'image.jpg'

  const uploaded = await client.assets.upload('image', buffer, { filename })

  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: uploaded._id },
  }
}
