import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContactForm from './contact-form'

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } })
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } })
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '412-555-0100' } })
  fireEvent.change(screen.getByLabelText(/message/i), {
    target: { value: 'Please quote my kitchen.' },
  })
}

describe('ContactForm', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('submits the required fields plus job address to /api/contact and shows a success message', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
    global.fetch = fetchMock as unknown as typeof fetch

    render(<ContactForm />)
    fillRequiredFields()
    fireEvent.change(screen.getByLabelText(/job address/i), { target: { value: '123 Main St' } })
    fireEvent.change(screen.getByLabelText(/^city/i), { target: { value: 'Pittsburgh' } })
    fireEvent.change(screen.getByLabelText(/^state/i), { target: { value: 'PA' } })
    fireEvent.change(screen.getByLabelText(/^zip/i), { target: { value: '15201' } })
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => {
      expect(screen.getByText(/thanks for reaching out/i)).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/contact',
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
        }),
      })
    )
  })

  it('submits successfully with the job address fields left blank', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
    global.fetch = fetchMock as unknown as typeof fetch

    render(<ContactForm />)
    fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => {
      expect(screen.getByText(/thanks for reaching out/i)).toBeInTheDocument()
    })
  })

  it('shows an error message when the submission fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Something went wrong sending your message.' }),
    }) as unknown as typeof fetch

    render(<ContactForm />)
    fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i)
  })
})
