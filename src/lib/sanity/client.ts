import { createClient } from 'next-sanity'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2026-09-04',
  useCdn: true,
})

export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  // Without an explicit revalidate window, Next's persistent build/data cache
  // can serve a fetch result indefinitely across deploys (verified: a stale
  // service title survived a full `next build` and only cleared once .next
  // was wiped). 60s keeps pages fast while ensuring Sanity edits actually
  // reach the live site within a minute instead of never.
  return sanityClient.fetch<T>(query, params, { next: { revalidate: 60 } })
}
