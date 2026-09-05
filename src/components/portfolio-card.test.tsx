import { render, screen } from '@testing-library/react'
import PortfolioCard from './portfolio-card'

describe('PortfolioCard', () => {
  it('renders the project title', () => {
    render(<PortfolioCard project={{ title: 'Modern kitchen with white cabinets' }} />)
    expect(screen.getByText('Modern kitchen with white cabinets')).toBeInTheDocument()
  })
})
