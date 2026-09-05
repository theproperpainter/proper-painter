jest.mock('./client', () => ({
  sanityClient: { projectId: 'nqr6djox', dataset: 'production' },
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
