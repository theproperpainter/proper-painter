// Mock sanity to avoid ESM issues
jest.mock('sanity', () => ({
  defineField: (field: any) => field,
  defineType: (type: any) => type,
}))

import { schemaTypes } from './index'

function fieldNames(schema: { fields?: { name: string }[] }) {
  return (schema.fields ?? []).map((f) => f.name)
}

describe('sanity schemas', () => {
  it('registers exactly the five content types from the spec', () => {
    const names = schemaTypes.map((s) => s.name).sort()
    expect(names).toEqual(
      ['portfolioProject', 'service', 'siteSettings', 'teamMember', 'testimonial'].sort()
    )
  })

  it('service has title, slug, summary, heroImage, gallery', () => {
    const service = schemaTypes.find((s) => s.name === 'service')!
    expect(fieldNames(service)).toEqual(
      expect.arrayContaining(['title', 'slug', 'summary', 'heroImage', 'gallery'])
    )
  })

  it('portfolioProject has title, category, beforeImage, afterImage, description', () => {
    const project = schemaTypes.find((s) => s.name === 'portfolioProject')!
    expect(fieldNames(project)).toEqual(
      expect.arrayContaining(['title', 'category', 'beforeImage', 'afterImage', 'description'])
    )
  })

  it('testimonial has quote, author, source', () => {
    const testimonial = schemaTypes.find((s) => s.name === 'testimonial')!
    expect(fieldNames(testimonial)).toEqual(expect.arrayContaining(['quote', 'author', 'source']))
  })

  it('teamMember has name, role, bio, photo', () => {
    const member = schemaTypes.find((s) => s.name === 'teamMember')!
    expect(fieldNames(member)).toEqual(expect.arrayContaining(['name', 'role', 'bio', 'photo']))
  })

  it('siteSettings has contactEmail, contactPhone, socialLinks', () => {
    const settings = schemaTypes.find((s) => s.name === 'siteSettings')!
    expect(fieldNames(settings)).toEqual(
      expect.arrayContaining(['contactEmail', 'contactPhone', 'socialLinks'])
    )
  })
})
