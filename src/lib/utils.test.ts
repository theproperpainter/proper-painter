import { cn } from './utils'

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts (last wins)', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('drops falsy values', () => {
    expect(cn('block', false && 'hidden', undefined, 'text-white')).toBe('block text-white')
  })
})
