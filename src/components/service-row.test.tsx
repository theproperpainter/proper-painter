import { render, screen } from '@testing-library/react'
import ServiceRow from './service-row'

describe('ServiceRow', () => {
  it('renders the service title and links to its page', () => {
    render(
      <ServiceRow
        service={{ title: 'Interior Painting', slug: { current: 'interior-painting' }, summary: 'A fresh coat.' }}
      />
    )
    const link = screen.getByRole('link', { name: /interior painting/i })
    expect(link).toHaveAttribute('href', '/services/interior-painting')
    expect(screen.getByText('A fresh coat.')).toBeInTheDocument()
  })

  it('renders without a summary when none is provided', () => {
    render(<ServiceRow service={{ title: 'Color Consultation', slug: { current: 'colorconsult' } }} />)
    expect(screen.getByRole('link', { name: /color consultation/i })).toBeInTheDocument()
  })
})
