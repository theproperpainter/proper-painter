jest.mock('./client', () => ({
  sanityFetch: jest.fn(),
}))

import { sanityFetch } from './client'
import {
  getAllServices,
  getServiceBySlug,
  getPortfolioProjects,
  getPortfolioProjectsByCategory,
  getTestimonials,
  getTeamMember,
  getSiteSettings,
} from './queries'

describe('queries', () => {
  beforeEach(() => {
    (sanityFetch as jest.Mock).mockReset()
  })

  it('getAllServices fetches all service documents', async () => {
    (sanityFetch as jest.Mock).mockResolvedValue([{ title: 'Interior Painting' }])
    const result = await getAllServices()
    expect(sanityFetch).toHaveBeenCalledWith(expect.stringContaining('_type == "service"'))
    expect(result).toEqual([{ title: 'Interior Painting' }])
  })

  it('getServiceBySlug fetches one service by slug', async () => {
    (sanityFetch as jest.Mock).mockResolvedValue({ title: 'Wallpaper' })
    const result = await getServiceBySlug('wallpaper')
    expect(sanityFetch).toHaveBeenCalledWith(
      expect.stringContaining('slug.current == $slug'),
      { slug: 'wallpaper' }
    )
    expect(result).toEqual({ title: 'Wallpaper' })
  })

  it('getPortfolioProjects fetches all portfolio project documents', async () => {
    (sanityFetch as jest.Mock).mockResolvedValue([{ title: 'Kitchen' }])
    const result = await getPortfolioProjects()
    expect(sanityFetch).toHaveBeenCalledWith(expect.stringContaining('_type == "portfolioProject"'))
    expect(result).toEqual([{ title: 'Kitchen' }])
  })

  it('getPortfolioProjectsByCategory filters by category', async () => {
    (sanityFetch as jest.Mock).mockResolvedValue([{ title: 'Staircase' }])
    const result = await getPortfolioProjectsByCategory('Restoration')
    expect(sanityFetch).toHaveBeenCalledWith(
      expect.stringContaining('category == $category'),
      { category: 'Restoration' }
    )
    expect(result).toEqual([{ title: 'Staircase' }])
  })

  it('getTestimonials fetches all testimonial documents', async () => {
    (sanityFetch as jest.Mock).mockResolvedValue([{ quote: 'Great!' }])
    const result = await getTestimonials()
    expect(sanityFetch).toHaveBeenCalledWith(expect.stringContaining('_type == "testimonial"'))
    expect(result).toEqual([{ quote: 'Great!' }])
  })

  it('getTeamMember fetches the single team member document', async () => {
    (sanityFetch as jest.Mock).mockResolvedValue({ name: 'Elizabeth Best' })
    const result = await getTeamMember()
    expect(sanityFetch).toHaveBeenCalledWith(expect.stringContaining('_type == "teamMember"'))
    expect(result).toEqual({ name: 'Elizabeth Best' })
  })

  it('getSiteSettings fetches the settings singleton by _id', async () => {
    (sanityFetch as jest.Mock).mockResolvedValue({ contactPhone: '412-427-6873' })
    const result = await getSiteSettings()
    expect(sanityFetch).toHaveBeenCalledWith(expect.stringContaining('_id == "siteSettings"'))
    expect(result).toEqual({ contactPhone: '412-427-6873' })
  })
})
