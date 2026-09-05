// Mock sanity modules to avoid ESM import issues in Jest
jest.mock('sanity', () => ({
  defineConfig: (config: any) => config,
}))
jest.mock('sanity/structure', () => ({
  structureTool: () => ({}),
}))
jest.mock('@sanity/vision', () => ({
  visionTool: () => ({}),
}))

import config from './sanity.config'

describe('sanity config', () => {
  it('is configured with a project ID and dataset', () => {
    expect(config.projectId).toBeTruthy()
    expect(config.dataset).toBe('production')
  })
})
