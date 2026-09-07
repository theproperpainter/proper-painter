import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import HomePage from './page'
import AboutPage from './about/page'
import PortfolioPage from './portfolio/page'
import TeamPage from './team/page'
import ContactPage from './contact/page'
import ServicesPage from './services/page'
import InteriorPaintingPage from './services/interior-painting/page'
import CabinetPaintingPage from './services/cabinetpainting/page'
import MinorRestorationPage from './services/minor-restoration/page'
import WallpaperPage from './services/wallpaper/page'
import FauxFinishesPage from './services/faux-finishes/page'
import ColorConsultPage from './services/colorconsult/page'
import ReviewsPage from './reviews/page'

jest.mock('@/lib/sanity/queries', () => ({
  getAllServices: jest.fn().mockResolvedValue([
    { title: 'Interior Painting', slug: { current: 'interior-painting' } },
    { title: 'Cabinet Painting', slug: { current: 'cabinetpainting' } },
  ]),
  getTestimonials: jest.fn().mockResolvedValue([
    { quote: 'Great work!', author: 'Jane D.', source: 'HomeAdvisor' },
    { quote: 'Highly recommend.', author: 'Sam K.', source: 'Direct' },
  ]),
  getServiceBySlug: jest.fn((slug: string) =>
    Promise.resolve({
      title: {
        'interior-painting': 'Interior Painting',
        'cabinetpainting': 'Cabinet Painting',
        'minor-restoration': 'Restoration',
        'wallpaper': 'Wallpaper',
        'faux-finishes': 'Faux Finishes',
        'colorconsult': 'Color Consultation',
      }[slug] ?? 'Interior Painting',
      slug: { current: slug },
      summary: 'A fresh coat for any room.',
    })
  ),
  getPortfolioProjects: jest.fn().mockResolvedValue([
    { title: 'Modern kitchen with white cabinets' },
    { title: 'Elegant spiral staircase' },
  ]),
  getPortfolioProjectsByCategory: jest.fn().mockResolvedValue([]),
  getPortfolioCategories: jest.fn().mockResolvedValue([]),
  getTeamMember: jest.fn().mockResolvedValue({
    name: 'Elizabeth Best',
    role: 'Owner, M. Arch',
    bio: 'A woman-owned business built on craft and care.',
  }),
  getSiteSettings: jest.fn().mockResolvedValue({
    contactPhone: '412-427-6873',
    contactEmail: 'theproperpainterllc@gmail.com',
  }),
}))

const pages: [string, () => ReactElement | Promise<ReactElement>, RegExp][] = [
  ['home', HomePage, /proper painter/i],
  ['about', AboutPage, /about the proper painter/i],
  ['portfolio', PortfolioPage, /portfolio/i],
  ['team', TeamPage, /elizabeth best/i],
  ['contact', ContactPage, /contact/i],
  ['services index', ServicesPage, /services/i],
  ['interior painting', InteriorPaintingPage, /interior painting/i],
  ['cabinet painting', CabinetPaintingPage, /cabinet/i],
  ['minor restoration', MinorRestorationPage, /restoration/i],
  ['wallpaper', WallpaperPage, /wallpaper/i],
  ['faux finishes', FauxFinishesPage, /faux finishes/i],
  ['color consult', ColorConsultPage, /color consult/i],
  ['reviews', ReviewsPage, /testimonials/i],
]

describe('every site-map route', () => {
  it.each(pages)('%s page renders a matching heading', async (_name, Page, expected) => {
    const jsx = await Page()
    render(jsx)
    expect(screen.getByRole('heading', { name: expected })).toBeInTheDocument()
  })
})
