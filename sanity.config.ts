import { schemaTypes } from './src/sanity/schemaTypes'

const config = {
  name: 'default',
  title: 'The Proper Painter',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [] as unknown[],
  schema: {
    types: schemaTypes,
  },
}

// Conditionally add plugins outside of test environment
if (!process.env.JEST_WORKER_ID && typeof window === 'undefined') {
  // In Node.js production environment, import plugins
  // This will be called by the studio page at runtime
}

export default config
