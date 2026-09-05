// Mock sanity modules to avoid ESM import issues in Jest
const defineConfigMock = jest.fn((config: any) => config)
jest.mock('sanity', () => ({
  defineConfig: defineConfigMock,
}))
jest.mock('sanity/structure', () => ({
  structureTool: jest.fn(() => ({ type: 'structureTool' })),
}))
jest.mock('@sanity/vision', () => ({
  visionTool: jest.fn(() => ({ type: 'visionTool' })),
}))

import config from './sanity.config'

describe('sanity config', () => {
  it('is configured with a project ID and dataset', () => {
    expect(config.projectId).toBeTruthy()
    expect(config.dataset).toBe('production')
  })

  it('calls defineConfig with plugins array', () => {
    // Verify defineConfig was actually called (not bypassed)
    expect(defineConfigMock).toHaveBeenCalled()

    // Get the config object passed to defineConfig
    const callArgs = defineConfigMock.mock.calls[0][0]

    // Verify plugins are properly wired (not an empty array)
    expect(callArgs.plugins).toBeDefined()
    expect(Array.isArray(callArgs.plugins)).toBe(true)
    expect(callArgs.plugins.length).toBe(2)
    expect(callArgs.plugins[0]).toEqual({ type: 'structureTool' })
    expect(callArgs.plugins[1]).toEqual({ type: 'visionTool' })
  })
})
