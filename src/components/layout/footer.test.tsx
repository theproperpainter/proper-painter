jest.mock('@/lib/sanity/queries', () => ({
  getSiteSettings: jest.fn(),
}))

import { render, screen } from '@testing-library/react'
import { getSiteSettings } from '@/lib/sanity/queries'
import Footer from './footer'

describe('Footer', () => {
  beforeEach(() => {
    (getSiteSettings as jest.Mock).mockResolvedValue({
      contactPhone: '412-427-6873',
      contactEmail: 'theproperpainterllc@gmail.com',
      socialLinks: [
        { platform: 'Facebook', url: 'https://facebook.com/theproperpainterllc' },
        { platform: 'Instagram', url: 'https://instagram.com/theproperpainterllc' },
      ],
    })
  })

  it('identifies the business as women-owned and operated', async () => {
    const jsx = await Footer()
    render(jsx)
    expect(screen.getByText(/women-owned/i)).toBeInTheDocument()
  })

  it('renders the real contact phone and email', async () => {
    const jsx = await Footer()
    render(jsx)
    expect(screen.getByText('412-427-6873')).toBeInTheDocument()
    expect(screen.getByText('theproperpainterllc@gmail.com')).toBeInTheDocument()
  })

  it('renders links for every social platform provided', async () => {
    const jsx = await Footer()
    render(jsx)
    expect(screen.getByRole('link', { name: /facebook/i })).toHaveAttribute(
      'href',
      'https://facebook.com/theproperpainterllc'
    )
    expect(screen.getByRole('link', { name: /instagram/i })).toHaveAttribute(
      'href',
      'https://instagram.com/theproperpainterllc'
    )
  })

  it('includes the current year in a copyright line', async () => {
    const jsx = await Footer()
    render(jsx)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
  })
})
