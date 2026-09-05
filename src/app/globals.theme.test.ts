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

function countDeclarations(name: string): number {
  const matches = css.match(new RegExp(`--color-${name}:`, 'g'))
  return matches ? matches.length : 0
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

  it('declares --color-background and --color-foreground exactly once each, so no later block (e.g. a shadcn "@theme inline") can shadow the brand tokens', () => {
    // This guards against a regression where a second @theme block redefines
    // --color-background/--color-foreground to point at the shadcn --background/
    // --foreground variables (which resolve to white/near-black), silently
    // overriding the pure black/white brand tokens defined above.
    expect(countDeclarations('background')).toBe(1)
    expect(countDeclarations('foreground')).toBe(1)
  })

  it('defines font-sans and font-serif referencing the loaded font variables', () => {
    expect(css).toMatch(/--font-sans:\s*var\(--font-inter\)/)
    expect(css).toMatch(/--font-serif:\s*var\(--font-playfair\)/)
  })
})
