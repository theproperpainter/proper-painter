import type { SanityClient } from '@sanity/client'

export interface ImageFieldValue {
  _type: 'image'
  asset: { _type: 'reference'; _ref: string }
}

function extractFilename(url: string): string {
  try {
    const parsed = new URL(url)
    const innerUrl = parsed.searchParams.get('url')
    if (innerUrl) {
      // Next.js image-proxy URL — pull the filename from the inner original URL
      const innerParsed = new URL(innerUrl)
      return innerParsed.pathname.split('/').pop() || 'image.jpg'
    }
    return parsed.pathname.split('/').pop() || 'image.jpg'
  } catch {
    return url.split('/').pop() || 'image.jpg'
  }
}

export async function uploadAsset(
  client: SanityClient,
  asset: { url: string; alt: string }
): Promise<ImageFieldValue> {
  const response = await fetch(asset.url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const filename = extractFilename(asset.url)

  const uploaded = await client.assets.upload('image', buffer, { filename })

  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: uploaded._id },
  }
}
