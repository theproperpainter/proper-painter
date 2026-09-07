jest.mock('next-sanity', () => ({
  createClient: jest.fn(() => ({ fetch: jest.fn().mockResolvedValue({ ok: true }) })),
}))

import { createClient } from 'next-sanity'
import { sanityClient, sanityFetch } from './client'

describe('sanityClient', () => {
  it('is created with the project ID and dataset from env vars', () => {
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        useCdn: true,
      })
    )
  })
})

describe('sanityFetch', () => {
  it('delegates to the underlying client fetch and returns its result', async () => {
    const result = await sanityFetch<{ ok: boolean }>('*[_type == "service"]')
    expect(result).toEqual({ ok: true })
    expect(sanityClient.fetch).toHaveBeenCalledWith('*[_type == "service"]', {}, { next: { revalidate: 60 } })
  })
})
