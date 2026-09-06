/**
 * @jest-environment node
 */
const originalEnv = process.env.ZAPIER_WEBHOOK_URL
const originalFetch = global.fetch

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    process.env.ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/test/'
  })

  afterEach(() => {
    process.env.ZAPIER_WEBHOOK_URL = originalEnv
    global.fetch = originalFetch
    jest.resetModules()
  })

  it('forwards a valid submission to the Zapier webhook and returns success', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    global.fetch = fetchMock as unknown as typeof fetch

    const { POST } = await import('./route')
    const response = await POST(
      makeRequest({ name: 'Jane Doe', email: 'jane@example.com', message: 'Please quote my kitchen.' })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.zapier.com/hooks/catch/test/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          message: 'Please quote my kitchen.',
          source: 'theproperpainter.com contact form',
        }),
      })
    )
  })

  it('rejects a submission missing required fields', async () => {
    const fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    const { POST } = await import('./route')
    const response = await POST(makeRequest({ name: 'Jane Doe', email: '', message: '' }))

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a submission with an invalid email', async () => {
    const { POST } = await import('./route')
    const response = await POST(
      makeRequest({ name: 'Jane Doe', email: 'not-an-email', message: 'Hello there.' })
    )

    expect(response.status).toBe(400)
  })

  it('returns a 500 with a helpful message when the webhook is not configured', async () => {
    delete process.env.ZAPIER_WEBHOOK_URL

    const { POST } = await import('./route')
    const response = await POST(
      makeRequest({ name: 'Jane Doe', email: 'jane@example.com', message: 'Hello there.' })
    )
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toMatch(/call or email/i)
  })

  it('returns a 502 when the Zapier webhook call fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch

    const { POST } = await import('./route')
    const response = await POST(
      makeRequest({ name: 'Jane Doe', email: 'jane@example.com', message: 'Hello there.' })
    )

    expect(response.status).toBe(502)
  })
})
