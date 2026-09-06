import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContactForm from './contact-form'

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane Doe' } })
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } })
  fireEvent.change(screen.getByLabelText(/message/i), {
    target: { value: 'Please quote my kitchen.' },
  })
  fireEvent.click(screen.getByRole('button', { name: /send message/i }))
}

describe('ContactForm', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('submits the form data to /api/contact and shows a success message', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
    global.fetch = fetchMock as unknown as typeof fetch

    render(<ContactForm />)
    fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText(/thanks for reaching out/i)).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          message: 'Please quote my kitchen.',
        }),
      })
    )
  })

  it('shows an error message when the submission fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Something went wrong sending your message.' }),
    }) as unknown as typeof fetch

    render(<ContactForm />)
    fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i)
  })
})
