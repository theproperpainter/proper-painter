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
import ColorConsultPage from './services/colorconsult/page'

const pages: [string, () => ReactElement, RegExp][] = [
  ['home', HomePage, /proper painter/i],
  ['about', AboutPage, /about/i],
  ['portfolio', PortfolioPage, /portfolio/i],
  ['team', TeamPage, /team/i],
  ['contact', ContactPage, /contact/i],
  ['services index', ServicesPage, /services/i],
  ['interior painting', InteriorPaintingPage, /interior painting/i],
  ['cabinet painting', CabinetPaintingPage, /cabinet/i],
  ['minor restoration', MinorRestorationPage, /restoration/i],
  ['wallpaper', WallpaperPage, /wallpaper/i],
  ['color consult', ColorConsultPage, /color consult/i],
]

describe('every site-map route', () => {
  it.each(pages)('%s page renders a matching heading', (_name, Page, expected) => {
    render(<Page />)
    expect(screen.getByRole('heading', { name: expected })).toBeInTheDocument()
  })
})
