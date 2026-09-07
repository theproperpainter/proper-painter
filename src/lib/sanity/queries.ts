import { sanityFetch } from './client'

export interface SanityImage {
  _type: 'image'
  asset: { _type: 'reference'; _ref: string }
}

export interface Service {
  title: string
  slug: { current: string }
  summary?: string
  heroImage?: SanityImage
}

export interface PortfolioProject {
  _id: string
  title: string
  category?: string
  afterImage?: SanityImage
  description?: string
}

export interface Testimonial {
  quote: string
  author: string
  source: string
}

export interface TeamMember {
  name: string
  role?: string
  bio?: string
  photo?: SanityImage
}

export interface SiteSettings {
  contactEmail?: string
  contactPhone?: string
  socialLinks?: { platform: string; url: string }[]
  logo?: SanityImage
}

export async function getAllServices(): Promise<Service[]> {
  return sanityFetch<Service[]>(`*[_type == "service"]{title, slug, summary, heroImage}`)
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return sanityFetch<Service | null>(
    `*[_type == "service" && slug.current == $slug][0]{title, slug, summary, heroImage}`,
    { slug }
  )
}

export async function getPortfolioProjects(): Promise<PortfolioProject[]> {
  return sanityFetch<PortfolioProject[]>(
    `*[_type == "portfolioProject"] | order(coalesce(order, 9999) asc) {_id, title, category, afterImage, description}`
  )
}

export async function getPortfolioProjectsByCategory(category: string): Promise<PortfolioProject[]> {
  return sanityFetch<PortfolioProject[]>(
    `*[_type == "portfolioProject" && category == $category] | order(coalesce(order, 9999) asc) {_id, title, category, afterImage, description}`,
    { category }
  )
}

export async function getPortfolioCategories(): Promise<string[]> {
  return sanityFetch<string[]>(
    `array::unique(*[_type == "portfolioProject" && defined(category)].category)`
  )
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return sanityFetch<Testimonial[]>(`*[_type == "testimonial"]{quote, author, source}`)
}

export async function getTeamMember(): Promise<TeamMember | null> {
  return sanityFetch<TeamMember | null>(`*[_type == "teamMember"][0]{name, role, bio, photo}`)
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return sanityFetch<SiteSettings | null>(
    `*[_id == "siteSettings"][0]{contactEmail, contactPhone, socialLinks, logo}`
  )
}
