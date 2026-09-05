/**
 * @jest-environment node
 */
jest.mock('@sanity/client', () => ({
  createClient: jest.fn(() => ({ create: jest.fn(), createOrReplace: jest.fn() })),
}))

describe('sanityWriteClient', () => {
  it('is created with the project ID, dataset, and a write token', () => {
    const { createClient } = require('@sanity/client')
    const { sanityWriteClient } = require('./sanity-write-client')

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        token: process.env.SANITY_API_TOKEN,
        useCdn: false,
      })
    )
  })
})
