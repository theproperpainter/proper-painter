jest.mock('@/lib/sanity/queries', () => ({
  getSiteSettings: jest.fn(),
}))

import { render, screen } from '@testing-library/react'
import { getSiteSettings } from '@/lib/sanity/queries'
import Header from './header'

describe('Header', () => {
  beforeEach(() => {
    (getSiteSettings as jest.Mock).mockResolvedValue({
      logo: { _type: 'image', asset: { _type: 'reference', _ref: 'image-abc-500x500-png' } },
    })
  })

  it('renders a link to every top-level site section', async () => {
    const jsx = await Header()
    render(jsx)
    const expected: [RegExp, string][] = [
      [/^home$/i, '/'],
      [/^about$/i, '/about'],
      [/^services$/i, '/services'],
      [/^portfolio$/i, '/portfolio'],
      [/^team$/i, '/team'],
      [/^reviews$/i, '/reviews'],
      [/^contact$/i, '/contact'],
    ]
    for (const [name, href] of expected) {
      // The header renders both a desktop nav and a mobile menu copy of each
      // link (toggled via CSS, not conditional rendering), so every match
      // must point to the right href.
      const links = screen.getAllByRole('link', { name })
      expect(links.length).toBeGreaterThan(0)
      for (const link of links) {
        expect(link).toHaveAttribute('href', href)
      }
    }
  })

  it('renders the real logo image when site settings provide one', async () => {
    const jsx = await Header()
    render(jsx)
    const logo = screen.getByAltText(/the proper painter/i)
    expect(logo.tagName).toBe('IMG')
  })

  it('renders a mobile menu toggle button', async () => {
    const jsx = await Header()
    render(jsx)
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
  })
})
