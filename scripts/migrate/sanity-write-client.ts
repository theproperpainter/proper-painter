import { createClient } from '@sanity/client'

export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2026-09-04',
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
})
