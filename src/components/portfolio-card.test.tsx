import { render, screen } from '@testing-library/react'
import PortfolioCard from './portfolio-card'

describe('PortfolioCard', () => {
  it('uses the project title as alt text without showing it as a visible caption', () => {
    render(
      <PortfolioCard
        project={{
          _id: 'test-id',
          title: 'Modern kitchen with white cabinets',
          afterImage: { _type: 'image', asset: { _type: 'reference', _ref: 'image-abc-800x600-png' } },
        }}
      />
    )
    expect(screen.getByAltText('Modern kitchen with white cabinets')).toBeInTheDocument()
    expect(screen.queryByText('Modern kitchen with white cabinets')).not.toBeInTheDocument()
  })
})
