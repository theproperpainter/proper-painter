import { render, screen } from '@testing-library/react'
import Footer from './footer'

describe('Footer', () => {
  it('identifies the business as women-owned and operated', () => {
    render(<Footer />)
    expect(screen.getByText(/women-owned/i)).toBeInTheDocument()
  })

  it('includes the current year in a copyright line', () => {
    render(<Footer />)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
  })
})
