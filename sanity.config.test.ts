import config from './sanity.config'

describe('sanity config', () => {
  it('is configured with a project ID and dataset', () => {
    expect(config.projectId).toBeTruthy()
    expect(config.dataset).toBe('production')
  })
})
