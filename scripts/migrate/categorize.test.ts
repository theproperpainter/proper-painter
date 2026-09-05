import { inferCategory } from './categorize'

describe('inferCategory', () => {
  it('maps kitchen/cabinet alt text to Cabinet Painting', () => {
    expect(inferCategory('Modern white kitchen with cabinets, a gas stove, and decorative plates on display.')).toBe('Cabinet Painting')
  })

  it('maps bathroom/living-room/general room alt text to Interior Painting', () => {
    expect(inferCategory('Modern bathroom with dark walls, white toilet, and matching vanity with a mirror and towel rack.')).toBe('Interior Painting')
    expect(inferCategory('Living room with a tufted leather sofa and glass door to a patio view.')).toBe('Interior Painting')
  })

  it('maps wallpaper-specific alt text to Wallpaper & Faux Finishes', () => {
    expect(inferCategory('Living room with patterned black and white wallpaper wall, leather sofa.')).toBe('Wallpaper & Faux Finishes')
  })

  it('maps staircase/restoration alt text to Restoration', () => {
    expect(inferCategory('Elegant spiral staircase with dark wood treads and white railing, illuminated by a crystal chandelier.')).toBe('Restoration')
  })

  it('falls back to Interior Painting for unrecognized alt text', () => {
    expect(inferCategory('A room in a house.')).toBe('Interior Painting')
  })
})
