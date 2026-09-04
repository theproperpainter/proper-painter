import fs from 'fs'
import path from 'path'

const css = fs.readFileSync(path.join(__dirname, 'globals.css'), 'utf8')

function extractVar(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!match) throw new Error(`--color-${name} not found in globals.css`)
  return match[1]
}

function isNeutral(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return r === g && g === b
}

describe('grayscale theme tokens (globals.css @theme)', () => {
  it('defines a pure black background and white foreground', () => {
    expect(extractVar('background')).toBe('#000000')
    expect(extractVar('foreground')).toBe('#ffffff')
  })

  it('defines a full neutral gray ramp with no accent hue', () => {
    const steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
    for (const step of steps) {
      const hex = extractVar(`gray-${step}`)
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
      expect(isNeutral(hex)).toBe(true)
    }
  })
})
