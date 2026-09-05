// The real ./sanity-write-client module imports @sanity/client, which ships
// as an ESM-only package — mock it out so importing seed-core-content.ts for
// its pure builder functions doesn't require a full ESM-aware Jest run.
jest.mock('./sanity-write-client', () => ({
  sanityWriteClient: { create: jest.fn(), createOrReplace: jest.fn() },
}))

import { buildTestimonialDocs, buildSiteSettingsDoc, buildTeamMemberDoc } from './seed-core-content'
import { reviews } from './reviews-data'

describe('buildTestimonialDocs', () => {
  it('builds one testimonial document per review with the correct shape', () => {
    const docs = buildTestimonialDocs(reviews)
    expect(docs).toHaveLength(27)
    expect(docs[0]).toEqual({
      _type: 'testimonial',
      quote: reviews[0].quote,
      author: reviews[0].author,
      source: reviews[0].source,
    })
  })
})

describe('buildSiteSettingsDoc', () => {
  it('builds the site settings document with real contact info, social links, and logo', () => {
    const fakeLogo = { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: 'image-fake-logo-jpg' } }
    const doc = buildSiteSettingsDoc(fakeLogo)
    expect(doc).toEqual({
      _type: 'siteSettings',
      _id: 'siteSettings',
      contactPhone: '412-427-6873',
      contactEmail: 'theproperpainterllc@gmail.com',
      logo: fakeLogo,
      socialLinks: [
        { platform: 'HomeAdvisor', url: 'https://www.homeadvisor.com/rated.TheProperPainterLLC.118848373.html' },
        { platform: 'Facebook', url: 'https://facebook.com/theproperpainterllc' },
        { platform: 'Instagram', url: 'https://instagram.com/theproperpainterllc' },
        { platform: 'Google Reviews', url: 'https://g.page/r/CQ7RtRHDEUczEAE/review' },
      ],
    })
  })
})

describe('buildTeamMemberDoc', () => {
  it('builds Elizabeth\'s team member document with her real bio', () => {
    const doc = buildTeamMemberDoc()
    expect(doc._type).toBe('teamMember')
    expect(doc.name).toBe('Elizabeth Best')
    expect(doc.role).toBe('Owner, M. Arch')
    expect(doc.bio.length).toBeGreaterThan(100)
    expect(doc.bio).toContain('Savannah College of Art')
  })
})
