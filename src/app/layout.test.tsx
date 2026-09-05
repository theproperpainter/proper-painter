jest.mock('next/font/google', () => ({
  Playfair_Display: jest.fn(() => ({ variable: '--font-playfair', className: 'mock-playfair' })),
  Inter: jest.fn(() => ({ variable: '--font-inter', className: 'mock-inter' })),
}))

jest.mock('@/components/layout/header', () => {
  return () => null
}, { virtual: true })

jest.mock('@/components/layout/footer', () => {
  return () => null
}, { virtual: true })

jest.mock('./globals.css', () => ({}), { virtual: true })

import { Playfair_Display, Inter } from 'next/font/google'

describe('RootLayout font setup', () => {
  it('loads Playfair Display and Inter with the expected CSS variable names', () => {
    require('./layout')
    expect(Playfair_Display).toHaveBeenCalledWith(
      expect.objectContaining({ variable: '--font-playfair' })
    )
    expect(Inter).toHaveBeenCalledWith(
      expect.objectContaining({ variable: '--font-inter' })
    )
  })
})
