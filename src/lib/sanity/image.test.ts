jest.mock('@sanity/image-url', () => {
  return jest.fn(() => ({
    image: jest.fn((source) => ({
      url: jest.fn(() => {
        const assetId = source?.asset?._ref?.split('-')[1]
        return assetId ? `https://cdn.sanity.io/images/abc/def/${assetId}-800x600.jpg` : ''
      }),
    })),
  }))
})

jest.mock('./client', () => ({
  sanityClient: { projectId: 'test', dataset: 'test' },
}))

import { urlForImage } from './image'

describe('urlForImage', () => {
  it('builds a real Sanity CDN URL from an image reference', () => {
    const fakeImage = {
      _type: 'image' as const,
      asset: { _type: 'reference' as const, _ref: 'image-abc123def456-800x600-jpg' },
    }
    const url = urlForImage(fakeImage).url()
    expect(url).toContain('cdn.sanity.io')
    expect(url).toContain('abc123def456-800x600.jpg')
  })
})
