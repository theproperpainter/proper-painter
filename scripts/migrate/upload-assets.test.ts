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

  it('extracts filename correctly from Next.js image-proxy URLs', async () => {
    const mockClient = {
      assets: {
        upload: jest.fn().mockResolvedValue({ _id: 'image-xyz789-1920x1080-png' }),
      },
    } as any

    const proxyUrl = 'https://theproperpainter.com/_next/image?url=https%3A%2F%2Fcdn.durable.co%2Fblocks%2F6enqV4xlLF4hyp3fOKXfZlcw9RdzhlNeg0cnsI5Lj4sgFELVlU6o7bshRP5aDl2T.png&w=1920&q=90'
    const result = await uploadAsset(mockClient, { url: proxyUrl, alt: 'Interior Painting' })

    expect(fetch).toHaveBeenCalledWith(proxyUrl)
    const uploadCall = mockClient.assets.upload.mock.calls[0]
    expect(uploadCall[0]).toBe('image')
    expect(uploadCall[1]).toBeInstanceOf(Buffer)
    const uploadOptions = uploadCall[2]
    expect(uploadOptions.filename).toBe('6enqV4xlLF4hyp3fOKXfZlcw9RdzhlNeg0cnsI5Lj4sgFELVlU6o7bshRP5aDl2T.png')
    expect(uploadOptions.filename).toMatch(/\.png$/)
    expect(uploadOptions.filename).not.toContain('?')
    expect(result).toEqual({
      _type: 'image',
      asset: { _type: 'reference', _ref: 'image-xyz789-1920x1080-png' },
    })
  })
})
