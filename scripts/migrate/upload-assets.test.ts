import { uploadAsset } from './upload-assets'

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
})

describe('uploadAsset', () => {
  it('downloads the image and uploads it to Sanity, returning an image field value', async () => {
    const mockClient = {
      assets: {
        upload: jest.fn().mockResolvedValue({ _id: 'image-abc123-800x600-jpg' }),
      },
    } as any

    const result = await uploadAsset(mockClient, { url: 'https://example.com/photo.jpg', alt: 'A kitchen' })

    expect(fetch).toHaveBeenCalledWith('https://example.com/photo.jpg')
    expect(mockClient.assets.upload).toHaveBeenCalledWith('image', expect.any(Buffer), {
      filename: 'photo.jpg',
    })
    expect(result).toEqual({
      _type: 'image',
      asset: { _type: 'reference', _ref: 'image-abc123-800x600-jpg' },
    })
  })
})
