import config from './tailwind.config'

describe('tailwind config', () => {
  it('defines a pure black background and white foreground token', () => {
    const colors = (config.theme?.extend?.colors ?? {}) as Record<string, string>
    expect(colors.background).toBe('#000000')
    expect(colors.foreground).toBe('#ffffff')
  })

  it('defines a full grayscale ramp with no accent hue', () => {
    const colors = (config.theme?.extend?.colors ?? {}) as Record<string, Record<string, string> | string>
    const gray = colors.gray as Record<string, string>
    const expectedSteps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
    for (const step of expectedSteps) {
      expect(gray[step]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
