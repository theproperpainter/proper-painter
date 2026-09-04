import { render, screen } from '@testing-library/react'
import Header from './header'

describe('Header', () => {
  it('renders a link to every top-level site section', () => {
    render(<Header />)
    const expected: [RegExp, string][] = [
      [/^home$/i, '/'],
      [/^about$/i, '/about'],
      [/^services$/i, '/services'],
      [/^portfolio$/i, '/portfolio'],
      [/^team$/i, '/team'],
      [/^contact$/i, '/contact'],
    ]
    for (const [name, href] of expected) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href)
    }
  })
})
