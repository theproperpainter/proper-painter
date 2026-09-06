import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Interior Painting')).toBe('interior-painting')
  })

  it('converts an ampersand to "and"', () => {
    expect(slugify('Color Consultation & Design')).toBe('color-consultation-and-design')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify('  Wallpaper!  ')).toBe('wallpaper')
  })
})
