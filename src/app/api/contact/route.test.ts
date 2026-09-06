/**
 * @jest-environment node
 */
const originalEnv = process.env.ZAPIER_WEBHOOK_URL
const originalFetch = global.fetch

const validSubmission = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '412-555-0100',
  jobAddress: '123 Main St',
  jobCity: 'Pittsburgh',
  jobState: 'PA',
  jobZip: '15201',
  message: 'Please quote my kitchen.',
}

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
    const response = await POST(makeRequest(validSubmission))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.zapier.com/hooks/catch/test/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          phone: '412-555-0100',
          jobAddress: '123 Main St',
          jobCity: 'Pittsburgh',
          jobState: 'PA',
          jobZip: '15201',
          message: 'Please quote my kitchen.',
          source: 'theproperpainter.com contact form',
        }),
      })
    )
  })

  it('accepts a submission with the job address fields left blank', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    global.fetch = fetchMock as unknown as typeof fetch

    const { POST } = await import('./route')
    const response = await POST(
      makeRequest({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '412-555-0100',
        message: 'Please quote my kitchen.',
      })
    )

    expect(response.status).toBe(200)
  })

  it.each(['firstName', 'lastName', 'email', 'phone', 'message'])(
    'rejects a submission missing the required field "%s"',
    async (field) => {
      const fetchMock = jest.fn()
      global.fetch = fetchMock as unknown as typeof fetch

      const { POST } = await import('./route')
      const response = await POST(makeRequest({ ...validSubmission, [field]: '' }))

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    }
  )

  it('rejects a submission with an invalid email', async () => {
    const { POST } = await import('./route')
    const response = await POST(makeRequest({ ...validSubmission, email: 'not-an-email' }))

    expect(response.status).toBe(400)
  })

  it('returns a 500 with a helpful message when the webhook is not configured', async () => {
    delete process.env.ZAPIER_WEBHOOK_URL

    const { POST } = await import('./route')
    const response = await POST(makeRequest(validSubmission))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toMatch(/call or email/i)
  })

  it('returns a 502 when the Zapier webhook call fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch

    const { POST } = await import('./route')
    const response = await POST(makeRequest(validSubmission))

    expect(response.status).toBe(502)
  })
})
