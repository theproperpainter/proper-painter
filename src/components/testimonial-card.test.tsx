import { render, screen } from '@testing-library/react'
import TestimonialCard from './testimonial-card'

describe('TestimonialCard', () => {
  it('renders the quote, author, and source', () => {
    render(<TestimonialCard testimonial={{ quote: 'Excellent work!', author: 'Jane D.', source: 'HomeAdvisor' }} />)
    expect(screen.getByText(/excellent work!/i)).toBeInTheDocument()
    expect(screen.getByText(/jane d\./i)).toBeInTheDocument()
    expect(screen.getByText(/homeadvisor/i)).toBeInTheDocument()
  })
})
