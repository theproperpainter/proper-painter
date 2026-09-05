import { render, screen } from '@testing-library/react'
import { Section, Container } from './section'

describe('Section', () => {
  it('renders children inside a section element with vertical padding', () => {
    render(<Section><p>Content</p></Section>)
    const section = screen.getByText('Content').closest('section')
    expect(section).not.toBeNull()
    expect(section?.className).toMatch(/py-/)
  })
})

describe('Container', () => {
  it('renders children inside a max-width container', () => {
    render(<Container><p>Inner</p></Container>)
    const div = screen.getByText('Inner').parentElement
    expect(div?.className).toMatch(/max-w-/)
  })
})
