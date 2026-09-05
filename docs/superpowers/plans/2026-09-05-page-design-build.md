# Page-by-Page Design Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every placeholder `<h1>` page with a real, designed layout against the real Sanity content, using a shared design system (typography, cards, layout primitives) applied consistently across all 12 routes.

**Architecture:** A small data layer (typed GROQ query functions + a Sanity image URL builder) feeds a handful of shared presentational components (cards, section/container primitives, redesigned Header/Footer), which pages compose. Every page task gives a real, working baseline layout and explicitly directs the implementer to refine it with the `frontend-design` and `ui-ux-pro-max` skills before committing — the baseline is a correct, tested starting point, not the final word on spacing/hierarchy polish.

**Tech Stack:** Next.js (App Router, Server Components), Tailwind v4, `next/font/google` (Playfair Display + Inter), `@sanity/image-url` (new dependency), the existing `sanityFetch` helper.

**Spec:** `docs/superpowers/specs/2026-09-05-page-design-build-design.md`

## Global Constraints

- No new color palette — grayscale tokens (`background`/`foreground`/`gray-50..950`) only, no accent color anywhere
- Typography: Playfair Display for headings, Inter for body text
- Site map: `/`, `/about`, `/team` (repurposed to Elizabeth's bio), `/reviews` (new), `/contact`, `/portfolio`, `/services` + 5 sub-pages (`interior-painting`, `cabinetpainting`, `minor-restoration`, `wallpaper`, `colorconsult`) — 12 routes total
- Content model field names (from earlier plans, unchanged): `service` (title, slug, summary, heroImage, gallery), `portfolioProject` (title, category, afterImage, description), `testimonial` (quote, author, source), `teamMember` (name, role, bio, photo), `siteSettings` (`_id: "siteSettings"`, contactEmail, contactPhone, socialLinks, logo)
- Portfolio categories currently in production data: "Cabinet Painting", "Restoration", "Wallpaper & Faux Finishes", "Interior Painting" — Color Consultation has no matching photos yet
- No DripJobs wiring, no new photography, no Elizabeth headshot — these are out of scope per the spec

---

### Task 1: Typography — load real fonts, wire into the design system

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/app/layout.test.tsx`
- Modify: `src/app/globals.theme.test.ts`

**Interfaces:**
- Produces: Tailwind utility classes `font-sans` (Inter) and `font-serif` (Playfair Display), with `font-serif` applied automatically to all heading elements — every later page/component task uses these via normal Tailwind classes, no new API.

- [ ] **Step 1: Write the failing test for the font wiring**

Create `src/app/layout.test.tsx`:

```tsx
jest.mock('next/font/google', () => ({
  Playfair_Display: jest.fn(() => ({ variable: '--font-playfair', className: 'mock-playfair' })),
  Inter: jest.fn(() => ({ variable: '--font-inter', className: 'mock-inter' })),
}))

import { Playfair_Display, Inter } from 'next/font/google'

describe('RootLayout font setup', () => {
  it('loads Playfair Display and Inter with the expected CSS variable names', () => {
    require('./layout')
    expect(Playfair_Display).toHaveBeenCalledWith(
      expect.objectContaining({ variable: '--font-playfair' })
    )
    expect(Inter).toHaveBeenCalledWith(
      expect.objectContaining({ variable: '--font-inter' })
    )
  })
})
```

Add to `src/app/globals.theme.test.ts` (append to the existing describe block, don't replace the file):

```ts
it('defines font-sans and font-serif referencing the loaded font variables', () => {
  expect(css).toMatch(/--font-sans:\s*var\(--font-inter\)/)
  expect(css).toMatch(/--font-serif:\s*var\(--font-playfair\)/)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/app/layout.test.tsx src/app/globals.theme.test.ts`
Expected: FAIL — `layout.tsx` doesn't call `Playfair_Display`/`Inter` yet, and `globals.css` doesn't reference `--font-inter`/`--font-playfair`

- [ ] **Step 3: Update `src/app/layout.tsx`**

Add the font imports and apply their variable classes to `<body>`. Keep the existing `Header`/`Footer` usage — only change the font-related parts:

```tsx
import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import './globals.css'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Proper Painter | Women-Owned Interior Painting',
  description: 'Women-owned and operated interior painting, cabinet painting, restoration, wallpaper, and color consultation.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Update `src/app/globals.css`**

Change the `--font-sans` and `--font-serif` lines inside the `@theme` block (the first one, with `--color-background`) from:

```css
--font-sans: var(--font-geist-sans);
--font-serif: ui-serif, Georgia, "Times New Roman", serif;
```

to:

```css
--font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
--font-serif: var(--font-playfair), ui-serif, Georgia, serif;
```

Then, inside the existing `@layer base { ... }` block at the bottom of the file, add a rule so headings use the serif font automatically without every component needing to add the class by hand:

```css
h1, h2, h3, h4, h5, h6 {
  @apply font-serif;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/app/layout.test.tsx src/app/globals.theme.test.ts`
Expected: PASS

- [ ] **Step 6: Manually verify in the browser**

```bash
npm run dev
```

Visit `http://localhost:3000` and confirm headings render in a serif typeface and body text in a clean sans-serif (not the default browser font) — open devtools and confirm no 404s for font files.

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx src/app/layout.test.tsx src/app/globals.css src/app/globals.theme.test.ts
git commit -m "feat: load Playfair Display and Inter, apply serif headings"
```

---

### Task 2: Sanity image URL builder

**Files:**
- Create: `src/lib/sanity/image.ts`
- Create: `src/lib/sanity/image.test.ts`

**Interfaces:**
- Consumes: `sanityClient` from `src/lib/sanity/client.ts`
- Produces: `urlForImage(source): ImageUrlBuilder` from `src/lib/sanity/image.ts` — every card/page component that renders a Sanity image calls `urlForImage(image).width(N).url()` (or similar builder chain) to get a real `<img>`/`next/image` `src`.

- [ ] **Step 1: Install the dependency**

```bash
npm install @sanity/image-url
```

- [ ] **Step 2: Write the failing test**

Create `src/lib/sanity/image.test.ts`:

```ts
import { urlForImage } from './image'

describe('urlForImage', () => {
  it('builds a real Sanity CDN URL from an image reference', () => {
    const fakeImage = {
      _type: 'image' as const,
      asset: { _type: 'reference' as const, _ref: 'image-abc123def456-800x600-jpg' },
    }
    const url = urlForImage(fakeImage).url()
    expect(url).toContain('cdn.sanity.io')
    expect(url).toContain('abc123def456-800x600.jpg')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/lib/sanity/image.test.ts`
Expected: FAIL — cannot find module `./image`

- [ ] **Step 4: Implement the builder**

Create `src/lib/sanity/image.ts`:

```ts
import createImageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { sanityClient } from './client'

const builder = createImageUrlBuilder(sanityClient)

export function urlForImage(source: SanityImageSource) {
  return builder.image(source)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/lib/sanity/image.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/sanity/image.ts src/lib/sanity/image.test.ts
git commit -m "feat: add Sanity image URL builder"
```

---

### Task 3: Typed GROQ query library

**Files:**
- Create: `src/lib/sanity/queries.ts`
- Create: `src/lib/sanity/queries.test.ts`

**Interfaces:**
- Consumes: `sanityFetch` from `src/lib/sanity/client.ts`
- Produces: `Service`, `PortfolioProject`, `Testimonial`, `TeamMember`, `SiteSettings`, `SanityImage` types, and `getAllServices`, `getServiceBySlug(slug)`, `getPortfolioProjects()`, `getPortfolioProjectsByCategory(category)`, `getTestimonials()`, `getTeamMember()`, `getSiteSettings()` functions — every page task in this plan imports these instead of calling `sanityFetch` directly.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/sanity/queries.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/sanity/queries.test.ts`
Expected: FAIL — cannot find module `./queries`

- [ ] **Step 3: Implement the query library**

Create `src/lib/sanity/queries.ts`:

```ts
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
    `*[_type == "portfolioProject"]{title, category, afterImage, description}`
  )
}

export async function getPortfolioProjectsByCategory(category: string): Promise<PortfolioProject[]> {
  return sanityFetch<PortfolioProject[]>(
    `*[_type == "portfolioProject" && category == $category]{title, afterImage, description}`,
    { category }
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/sanity/queries.test.ts`
Expected: PASS (7 cases)

- [ ] **Step 5: Commit**

```bash
git add src/lib/sanity/queries.ts src/lib/sanity/queries.test.ts
git commit -m "feat: add typed GROQ query library for content fetching"
```

---

### Task 4: Section/Container layout primitives

**Files:**
- Create: `src/components/ui/section.tsx`
- Create: `src/components/ui/section.test.tsx`

**Interfaces:**
- Produces: `Section` and `Container` components from `src/components/ui/section.tsx` — every page task wraps its content in these for consistent max-width, padding, and vertical rhythm.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/section.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Section, Container } from './section'

describe('Section', () => {
  it('renders children inside a section element with vertical padding', () => {
    render(<Section><p>Content</p></Section>)
    const section = screen.getByText('Content').closest('section')
    expect(section).not.toBeNull()
    expect(section?.className).toMatch(/py-/)
  })
})

describe('Container', () => {
  it('renders children inside a max-width container', () => {
    render(<Container><p>Inner</p></Container>)
    const div = screen.getByText('Inner').parentElement
    expect(div?.className).toMatch(/max-w-/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/section.test.tsx`
Expected: FAIL — cannot find module `./section`

- [ ] **Step 3: Implement the primitives**

Create `src/components/ui/section.tsx`:

```tsx
import { cn } from '@/lib/utils'

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mx-auto max-w-6xl px-6', className)}>{children}</div>
}

export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('py-16 md:py-24', className)}>
      <Container>{children}</Container>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/ui/section.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/section.tsx src/components/ui/section.test.tsx
git commit -m "feat: add Section and Container layout primitives"
```

---

### Task 5: Card components (ServiceCard, PortfolioCard, TestimonialCard)

**Files:**
- Create: `src/components/service-card.tsx`
- Create: `src/components/portfolio-card.tsx`
- Create: `src/components/testimonial-card.tsx`
- Create: `src/components/service-card.test.tsx`
- Create: `src/components/portfolio-card.test.tsx`
- Create: `src/components/testimonial-card.test.tsx`

**Interfaces:**
- Consumes: `urlForImage` (Task 2), `Service`/`PortfolioProject`/`Testimonial` types (Task 3)
- Produces: `ServiceCard`, `PortfolioCard`, `TestimonialCard` components — the Home, Services index, Portfolio, and Reviews page tasks all import and compose these rather than hand-rolling their own card markup.

- [ ] **Step 1: Write the failing tests**

Create `src/components/service-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import ServiceCard from './service-card'

describe('ServiceCard', () => {
  it('renders the service title and links to its page', () => {
    render(
      <ServiceCard
        service={{ title: 'Interior Painting', slug: { current: 'interior-painting' }, summary: 'A fresh coat.' }}
      />
    )
    const link = screen.getByRole('link', { name: /interior painting/i })
    expect(link).toHaveAttribute('href', '/services/interior-painting')
    expect(screen.getByText('A fresh coat.')).toBeInTheDocument()
  })

  it('renders without a summary when none is provided', () => {
    render(<ServiceCard service={{ title: 'Color Consultation', slug: { current: 'colorconsult' } }} />)
    expect(screen.getByRole('link', { name: /color consultation/i })).toBeInTheDocument()
  })
})
```

Create `src/components/portfolio-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import PortfolioCard from './portfolio-card'

describe('PortfolioCard', () => {
  it('renders the project title', () => {
    render(<PortfolioCard project={{ title: 'Modern kitchen with white cabinets' }} />)
    expect(screen.getByText('Modern kitchen with white cabinets')).toBeInTheDocument()
  })
})
```

Create `src/components/testimonial-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import TestimonialCard from './testimonial-card'

describe('TestimonialCard', () => {
  it('renders the quote, author, and source', () => {
    render(<TestimonialCard testimonial={{ quote: 'Excellent work!', author: 'Jane D.', source: 'HomeAdvisor' }} />)
    expect(screen.getByText(/excellent work!/i)).toBeInTheDocument()
    expect(screen.getByText(/jane d\./i)).toBeInTheDocument()
    expect(screen.getByText(/homeadvisor/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/components/service-card.test.tsx src/components/portfolio-card.test.tsx src/components/testimonial-card.test.tsx`
Expected: FAIL — none of the three components exist yet

- [ ] **Step 3: Implement the components**

Create `src/components/service-card.tsx`:

```tsx
import Link from 'next/link'
import { urlForImage } from '@/lib/sanity/image'
import type { Service } from '@/lib/sanity/queries'

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services/${service.slug.current}`}
      className="group block border border-gray-800 transition-colors hover:border-gray-600"
    >
      {service.heroImage ? (
        <img
          src={urlForImage(service.heroImage).width(600).height(400).url()}
          alt={service.title}
          className="h-48 w-full object-cover grayscale"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-gray-900 text-gray-500">
          {service.title}
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg">{service.title}</h3>
        {service.summary && <p className="mt-1 text-sm text-gray-400">{service.summary}</p>}
      </div>
    </Link>
  )
}
```

Create `src/components/portfolio-card.tsx`:

```tsx
import { urlForImage } from '@/lib/sanity/image'
import type { PortfolioProject } from '@/lib/sanity/queries'

export default function PortfolioCard({ project }: { project: PortfolioProject }) {
  return (
    <figure className="border border-gray-800">
      {project.afterImage && (
        <img
          src={urlForImage(project.afterImage).width(800).height(600).url()}
          alt={project.title}
          className="h-64 w-full object-cover grayscale"
        />
      )}
      <figcaption className="p-4 text-sm text-gray-400">{project.title}</figcaption>
    </figure>
  )
}
```

Create `src/components/testimonial-card.tsx`:

```tsx
import type { Testimonial } from '@/lib/sanity/queries'

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="border border-gray-800 p-6">
      <blockquote className="text-foreground">&ldquo;{testimonial.quote}&rdquo;</blockquote>
      <figcaption className="mt-4 text-sm text-gray-400">
        &mdash; {testimonial.author} <span className="text-gray-600">({testimonial.source})</span>
      </figcaption>
    </figure>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/service-card.test.tsx src/components/portfolio-card.test.tsx src/components/testimonial-card.test.tsx`
Expected: PASS (3 test files)

- [ ] **Step 5: Commit**

```bash
git add src/components/service-card.tsx src/components/portfolio-card.tsx src/components/testimonial-card.tsx src/components/service-card.test.tsx src/components/portfolio-card.test.tsx src/components/testimonial-card.test.tsx
git commit -m "feat: add ServiceCard, PortfolioCard, and TestimonialCard components"
```

---

### Task 6: Redesign Header (real logo + mobile menu)

**Files:**
- Modify: `src/components/layout/header.tsx`
- Modify: `src/components/layout/header.test.tsx`

**Interfaces:**
- Consumes: `getSiteSettings` (Task 3), `urlForImage` (Task 2)
- Produces: `Header` is now an async Server Component (was previously synchronous) — the root layout already just renders `<Header />`, so no caller changes are needed, but note this for whoever next touches `layout.tsx`.

- [ ] **Step 1: Write the failing test**

Replace `src/components/layout/header.test.tsx` with:

```tsx
jest.mock('@/lib/sanity/queries', () => ({
  getSiteSettings: jest.fn(),
}))

import { render, screen } from '@testing-library/react'
import { getSiteSettings } from '@/lib/sanity/queries'
import Header from './header'

describe('Header', () => {
  beforeEach(() => {
    (getSiteSettings as jest.Mock).mockResolvedValue({
      logo: { _type: 'image', asset: { _type: 'reference', _ref: 'image-abc-500x500-png' } },
    })
  })

  it('renders a link to every top-level site section', async () => {
    const jsx = await Header()
    render(jsx)
    const expected: [RegExp, string][] = [
      [/^home$/i, '/'],
      [/^about$/i, '/about'],
      [/^services$/i, '/services'],
      [/^portfolio$/i, '/portfolio'],
      [/^team$/i, '/team'],
      [/^reviews$/i, '/reviews'],
      [/^contact$/i, '/contact'],
    ]
    for (const [name, href] of expected) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href)
    }
  })

  it('renders the real logo image when site settings provide one', async () => {
    const jsx = await Header()
    render(jsx)
    const logo = screen.getByAltText(/the proper painter/i)
    expect(logo.tagName).toBe('IMG')
  })

  it('renders a mobile menu toggle button', async () => {
    const jsx = await Header()
    render(jsx)
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/layout/header.test.tsx`
Expected: FAIL — current `Header` is synchronous with no logo/menu/reviews link

- [ ] **Step 3: Implement the new Header**

Replace `src/components/layout/header.tsx`:

```tsx
import Link from 'next/link'
import { getSiteSettings } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/team', label: 'Team' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/contact', label: 'Contact' },
]

export default async function Header() {
  const settings = await getSiteSettings()

  return (
    <header className="border-b border-gray-800 bg-background">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          {settings?.logo ? (
            <img
              src={urlForImage(settings.logo).width(48).height(48).url()}
              alt="The Proper Painter"
              className="h-12 w-12 rounded-full grayscale"
            />
          ) : null}
          <span className="text-lg font-semibold tracking-wide text-foreground">The Proper Painter</span>
        </Link>

        <ul className="hidden gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm text-foreground hover:text-gray-400">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <details className="md:hidden">
          <summary className="list-none">
            <button type="button" aria-label="Menu" className="text-foreground">
              &#9776;
            </button>
          </summary>
          <ul className="absolute left-0 right-0 flex flex-col gap-4 border-b border-gray-800 bg-background px-6 py-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-foreground hover:text-gray-400">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </nav>
    </header>
  )
}
```

(Using a native `<details>`/`<summary>` disclosure for the mobile menu avoids needing client-side state/JavaScript for a simple show/hide — appropriate for this task; the `frontend-design` skill pass in Step 6 below may refine this into a more polished interaction if warranted.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/layout/header.test.tsx`
Expected: PASS (3 cases)

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — check that no other test assumed `Header` was synchronous (search for other direct imports/renders of `Header` if any fail)

- [ ] **Step 6: Art-direct the header**

Invoke the `frontend-design` skill to review this Header's visual treatment (logo sizing/placement, nav spacing, mobile menu presentation) against the rest of the design system established in Task 1, and refine the Tailwind classes accordingly — keep the same test-covered structure (same links, same alt text, same button role) so the tests above continue to pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/header.tsx src/components/layout/header.test.tsx
git commit -m "feat: redesign Header with real logo and mobile menu"
```

---

### Task 7: Redesign Footer (real logo + social links + contact)

**Files:**
- Modify: `src/components/layout/footer.tsx`
- Modify: `src/components/layout/footer.test.tsx`

**Interfaces:**
- Consumes: `getSiteSettings` (Task 3), `urlForImage` (Task 2)
- Produces: `Footer` is now an async Server Component (same note as Header).

- [ ] **Step 1: Write the failing test**

Replace `src/components/layout/footer.test.tsx` with:

```tsx
jest.mock('@/lib/sanity/queries', () => ({
  getSiteSettings: jest.fn(),
}))

import { render, screen } from '@testing-library/react'
import { getSiteSettings } from '@/lib/sanity/queries'
import Footer from './footer'

describe('Footer', () => {
  beforeEach(() => {
    (getSiteSettings as jest.Mock).mockResolvedValue({
      contactPhone: '412-427-6873',
      contactEmail: 'theproperpainterllc@gmail.com',
      socialLinks: [
        { platform: 'Facebook', url: 'https://facebook.com/theproperpainterllc' },
        { platform: 'Instagram', url: 'https://instagram.com/theproperpainterllc' },
      ],
    })
  })

  it('identifies the business as women-owned and operated', async () => {
    const jsx = await Footer()
    render(jsx)
    expect(screen.getByText(/women-owned/i)).toBeInTheDocument()
  })

  it('renders the real contact phone and email', async () => {
    const jsx = await Footer()
    render(jsx)
    expect(screen.getByText('412-427-6873')).toBeInTheDocument()
    expect(screen.getByText('theproperpainterllc@gmail.com')).toBeInTheDocument()
  })

  it('renders links for every social platform provided', async () => {
    const jsx = await Footer()
    render(jsx)
    expect(screen.getByRole('link', { name: /facebook/i })).toHaveAttribute(
      'href',
      'https://facebook.com/theproperpainterllc'
    )
    expect(screen.getByRole('link', { name: /instagram/i })).toHaveAttribute(
      'href',
      'https://instagram.com/theproperpainterllc'
    )
  })

  it('includes the current year in a copyright line', async () => {
    const jsx = await Footer()
    render(jsx)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/layout/footer.test.tsx`
Expected: FAIL — current `Footer` is synchronous, has no contact info or social links

- [ ] **Step 3: Implement the new Footer**

Replace `src/components/layout/footer.tsx`:

```tsx
import { getSiteSettings } from '@/lib/sanity/queries'

export default async function Footer() {
  const settings = await getSiteSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-800 bg-background py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-sm text-gray-400">
        <p className="text-foreground">
          The Proper Painter — Women-Owned &amp; Operated, Fully Insured Licensed Contractor
        </p>

        {(settings?.contactPhone || settings?.contactEmail) && (
          <p>
            {settings?.contactPhone && <span>{settings.contactPhone}</span>}
            {settings?.contactPhone && settings?.contactEmail && <span> · </span>}
            {settings?.contactEmail && <span>{settings.contactEmail}</span>}
          </p>
        )}

        {settings?.socialLinks && settings.socialLinks.length > 0 && (
          <ul className="flex gap-4">
            {settings.socialLinks.map((link) => (
              <li key={link.platform}>
                <a href={link.url} className="hover:text-foreground" target="_blank" rel="noreferrer">
                  {link.platform}
                </a>
              </li>
            ))}
          </ul>
        )}

        <p>&copy; {year} The Proper Painter. All rights reserved.</p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/layout/footer.test.tsx`
Expected: PASS (4 cases)

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Art-direct the footer**

Invoke the `frontend-design` skill to refine the Footer's visual treatment (spacing, information hierarchy between the business line, contact info, and social links) — keep the same test-covered content and structure.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/footer.tsx src/components/layout/footer.test.tsx
git commit -m "feat: redesign Footer with real contact info and social links"
```

---

### Task 8: Home page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/routes.test.tsx` (the Home page's test case needs updating since it's no longer a bare `<h1>`)

**Interfaces:**
- Consumes: `getAllServices`, `getTestimonials` (Task 3), `ServiceCard`, `TestimonialCard` (Task 5), `Section`/`Container` (Task 4)

- [ ] **Step 1: Update the failing test**

`src/app/routes.test.tsx` currently mocks nothing and expects Home's rendered heading to match `/proper painter/i`. Since Home now fetches data, add a mock at the top of the file (if not already present from other tasks) and update just the Home-related test setup. Add this above the `describe` block:

```tsx
jest.mock('@/lib/sanity/queries', () => ({
  getAllServices: jest.fn().mockResolvedValue([]),
  getTestimonials: jest.fn().mockResolvedValue([]),
  getServiceBySlug: jest.fn().mockResolvedValue(null),
  getPortfolioProjects: jest.fn().mockResolvedValue([]),
  getPortfolioProjectsByCategory: jest.fn().mockResolvedValue([]),
  getTeamMember: jest.fn().mockResolvedValue(null),
  getSiteSettings: jest.fn().mockResolvedValue(null),
}))
```

Then update the `pages` array's type annotation and the `it.each` test body to handle async page components. Pages convert from synchronous to async one task at a time across this plan (Task 8 converts Home now; the rest stay synchronous until their own tasks run), so the array's function type must accept both shapes at once — `await` on a plain (non-Promise) return value resolves immediately, so this works correctly for sync and async pages alike without an `if`/branch:

```tsx
const pages: [string, () => ReactElement | Promise<ReactElement>, RegExp][] = [
  // ...unchanged entries...
]

describe('every site-map route', () => {
  it.each(pages)('%s page renders a matching heading', async (_name, Page, expected) => {
    const jsx = await Page()
    render(jsx)
    expect(screen.getByRole('heading', { name: expected })).toBeInTheDocument()
  })
})
```

Only change the `pages` array's TYPE annotation and the `describe` block's test body here — leave every entry's tuple values as-is except the Home one (update its regex if your new heading text needs a different match than the existing `/proper painter/i`, which should still match "The Proper Painter" from Task 8's `<h1>`). Later tasks in this plan update their own entries; this task only needs Home's test to pass — other cases may still fail until their own tasks convert them, which is expected at this point in the plan.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/routes.test.tsx`
Expected: FAIL — `page.tsx` still renders a plain `<h1>`, not real content

- [ ] **Step 3: Implement the Home page**

Replace `src/app/page.tsx`:

```tsx
import Link from 'next/link'
import { getAllServices, getTestimonials } from '@/lib/sanity/queries'
import ServiceCard from '@/components/service-card'
import TestimonialCard from '@/components/testimonial-card'
import { Section } from '@/components/ui/section'

export default async function HomePage() {
  const [services, testimonials] = await Promise.all([getAllServices(), getTestimonials()])
  const featuredTestimonials = testimonials.slice(0, 4)

  return (
    <>
      <Section>
        <h1 className="text-4xl md:text-5xl">The Proper Painter</h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-400">
          Women-owned and operated interior painting, right in your neighborhood.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-block border border-foreground px-6 py-3 text-sm hover:bg-foreground hover:text-background"
        >
          Get a Quote
        </Link>
      </Section>

      <Section className="border-t border-gray-800">
        <h2 className="text-3xl">Our Services</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.slug.current} service={service} />
          ))}
        </div>
      </Section>

      <Section className="border-t border-gray-800">
        <h2 className="text-3xl">Meet Elizabeth</h2>
        <p className="mt-4 max-w-2xl text-gray-400">
          A woman-owned business built on craft, care, and a mission to bring more women into
          the trades.
        </p>
        <Link href="/team" className="mt-4 inline-block text-sm underline hover:text-gray-400">
          Learn more about our team
        </Link>
      </Section>

      {featuredTestimonials.length > 0 && (
        <Section className="border-t border-gray-800">
          <h2 className="text-3xl">What Clients Say</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {featuredTestimonials.map((t, i) => (
              <TestimonialCard key={i} testimonial={t} />
            ))}
          </div>
        </Section>
      )}

      <Section className="border-t border-gray-800 text-center">
        <h2 className="text-3xl">Ready to Transform Your Space?</h2>
        <Link
          href="/contact"
          className="mt-6 inline-block border border-foreground px-6 py-3 text-sm hover:bg-foreground hover:text-background"
        >
          Contact Us
        </Link>
      </Section>
    </>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/routes.test.tsx`
Expected: PASS for the Home case (other cases may still fail until their own tasks convert them — that's expected at this point in the plan)

- [ ] **Step 5: Art-direct the homepage**

Invoke the `frontend-design` and `ui-ux-pro-max` skills to refine the hero treatment, spacing rhythm between sections, and overall visual hierarchy beyond this functional baseline — keep the same headings/links/test-covered structure.

- [ ] **Step 6: Manually verify in the browser**

```bash
npm run dev
```

Visit `http://localhost:3000` and confirm real services and testimonials render (not empty sections) — this requires your `.env.local` to have real Sanity credentials, which it already does from earlier plans.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/app/routes.test.tsx
git commit -m "feat: build real Home page with services and testimonials"
```

---

### Task 9: About page

**Files:**
- Modify: `src/app/about/page.tsx`
- Modify: `src/app/routes.test.tsx`

**Interfaces:**
- Consumes: `Section`/`Container` (Task 4). No Sanity content — this page's mission/story copy is static, matching the spec's "company story & mission" scope.

- [ ] **Step 1: Update the failing test**

In `src/app/routes.test.tsx`, update the About entry's expected heading regex to `/about the proper painter/i` (the new page uses a more specific heading than the old bare "About").

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/routes.test.tsx`
Expected: FAIL for the About case

- [ ] **Step 3: Implement the About page**

Replace `src/app/about/page.tsx`:

```tsx
import { Section } from '@/components/ui/section'

export default function AboutPage() {
  return (
    <Section>
      <h1 className="text-4xl">About The Proper Painter</h1>
      <div className="mt-6 max-w-2xl space-y-4 text-gray-400">
        <p>
          The Proper Painter is a women-owned and operated interior painting company,
          fully insured and licensed, built on a belief that craft and care go hand in hand.
        </p>
        <p>
          Founded by Elizabeth Best, an architect by training, the business is guided by a
          mission that goes beyond painting walls: fostering and inspiring other women to
          enter the trades, proving that skilled, hands-on work is for anyone willing to do
          it properly.
        </p>
        <p>
          &ldquo;If it&rsquo;s worth doing, do your best.&rdquo;
        </p>
      </div>
    </Section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/routes.test.tsx`
Expected: PASS for the About case

- [ ] **Step 5: Art-direct the page**

Invoke the `frontend-design` skill to refine typography/spacing for this story-focused page — keep the heading text matching the test.

- [ ] **Step 6: Commit**

```bash
git add src/app/about/page.tsx src/app/routes.test.tsx
git commit -m "feat: build real About page with company story and mission"
```

---

### Task 10: Team page (repurposed to Elizabeth's bio)

**Files:**
- Modify: `src/app/team/page.tsx`
- Modify: `src/app/routes.test.tsx`

**Interfaces:**
- Consumes: `getTeamMember` (Task 3)

- [ ] **Step 1: Update the failing test**

In `src/app/routes.test.tsx`, update the Team entry: import path stays `./team/page`, but update the expected heading regex to `/elizabeth best/i` (this page is now her profile, not a bare "Team" heading), and make sure `getTeamMember` in the top-of-file mock (from Task 8) resolves to a real-shaped value for this test:

```ts
getTeamMember: jest.fn().mockResolvedValue({
  name: 'Elizabeth Best',
  role: 'Owner, M. Arch',
  bio: 'A woman-owned business built on craft and care.',
}),
```

(Update the shared mock object added in Task 8 rather than creating a second one.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/routes.test.tsx`
Expected: FAIL for the Team case

- [ ] **Step 3: Implement the Team page**

Replace `src/app/team/page.tsx`:

```tsx
import { getTeamMember } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { Section } from '@/components/ui/section'

export default async function TeamPage() {
  const member = await getTeamMember()

  return (
    <Section>
      {member ? (
        <div className="max-w-2xl">
          {member.photo ? (
            <img
              src={urlForImage(member.photo).width(300).height(300).url()}
              alt={member.name}
              className="mb-6 h-40 w-40 rounded-full object-cover grayscale"
            />
          ) : null}
          <h1 className="text-4xl">{member.name}</h1>
          {member.role && <p className="mt-1 text-gray-400">{member.role}</p>}
          {member.bio && <p className="mt-6 whitespace-pre-line text-gray-400">{member.bio}</p>}
        </div>
      ) : (
        <h1 className="text-4xl">Our Team</h1>
      )}
    </Section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/routes.test.tsx`
Expected: PASS for the Team case

- [ ] **Step 5: Art-direct the page**

Invoke the `frontend-design` skill to refine the profile layout — note there is no headshot photo yet, so the no-photo branch (bare heading fallback aside — `member` will exist with no `photo` field) should look intentional, not like a missing-image placeholder. Keep it text-forward.

- [ ] **Step 6: Commit**

```bash
git add src/app/team/page.tsx src/app/routes.test.tsx
git commit -m "feat: repurpose Team page as Elizabeth's profile"
```

---

### Task 11: Reviews page (new route)

**Files:**
- Create: `src/app/reviews/page.tsx`
- Modify: `src/app/routes.test.tsx`

**Interfaces:**
- Consumes: `getTestimonials` (Task 3), `TestimonialCard` (Task 5)

- [ ] **Step 1: Update the failing test**

In `src/app/routes.test.tsx`, add a new entry to the `pages` array (add the import at the top and the tuple in the array):

```tsx
import ReviewsPage from './reviews/page'
```

```tsx
['reviews', ReviewsPage, /client reviews/i],
```

Also update the shared `getTestimonials` mock (from Task 8) to return a couple of real-shaped testimonials so this test has something to assert on:

```ts
getTestimonials: jest.fn().mockResolvedValue([
  { quote: 'Great work!', author: 'Jane D.', source: 'HomeAdvisor' },
  { quote: 'Highly recommend.', author: 'Sam K.', source: 'Direct' },
]),
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/routes.test.tsx`
Expected: FAIL — cannot find module `./reviews/page`

- [ ] **Step 3: Implement the Reviews page**

Create `src/app/reviews/page.tsx`:

```tsx
import { getTestimonials } from '@/lib/sanity/queries'
import TestimonialCard from '@/components/testimonial-card'
import { Section } from '@/components/ui/section'

export default async function ReviewsPage() {
  const testimonials = await getTestimonials()

  return (
    <Section>
      <h1 className="text-4xl">Client Reviews</h1>
      <p className="mt-2 text-gray-400">{testimonials.length} reviews from real clients.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <TestimonialCard key={i} testimonial={t} />
        ))}
      </div>
    </Section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/routes.test.tsx`
Expected: PASS for the Reviews case

- [ ] **Step 5: Add the smoke test route**

Update `e2e/staging-smoke.test.ts`'s `routes` array to add `'/reviews'` alongside the existing routes, and update the count-based expectations if the test asserts a specific route count anywhere (check the file — if it doesn't hardcode a count, no further change is needed).

- [ ] **Step 6: Art-direct the page**

Invoke the `frontend-design` skill to refine the grid layout for a page holding 27 real testimonials — consider whether a masonry-style or uniform grid best fits the varying quote lengths.

- [ ] **Step 7: Commit**

```bash
git add src/app/reviews/page.tsx src/app/routes.test.tsx e2e/staging-smoke.test.ts
git commit -m "feat: add new Reviews page showing all client testimonials"
```

---

### Task 12: Services index page

**Files:**
- Modify: `src/app/services/page.tsx`
- Modify: `src/app/routes.test.tsx`

**Interfaces:**
- Consumes: `getAllServices` (Task 3), `ServiceCard` (Task 5)

- [ ] **Step 1: Update the failing test**

Update the shared `getAllServices` mock (from Task 8) to return real-shaped data:

```ts
getAllServices: jest.fn().mockResolvedValue([
  { title: 'Interior Painting', slug: { current: 'interior-painting' } },
  { title: 'Cabinet Painting', slug: { current: 'cabinetpainting' } },
]),
```

The Services index entry in the `pages` array already expects `/services/i` — that still matches "Our Services" or similar, so no change needed there unless you change the heading text (keep it matching whatever heading you write in Step 3).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/routes.test.tsx`
Expected: FAIL — current page is a bare `<h1>Services</h1>` with no service list

- [ ] **Step 3: Implement the Services index page**

Replace `src/app/services/page.tsx`:

```tsx
import { getAllServices } from '@/lib/sanity/queries'
import ServiceCard from '@/components/service-card'
import { Section } from '@/components/ui/section'

export default async function ServicesPage() {
  const services = await getAllServices()

  return (
    <Section>
      <h1 className="text-4xl">Our Services</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.slug.current} service={service} />
        ))}
      </div>
    </Section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/routes.test.tsx`
Expected: PASS for the Services index case

- [ ] **Step 5: Art-direct the page**

Invoke the `ui-ux-pro-max` skill to confirm the grid/card sizing is consistent with the Home page's services grid (Task 8) — these two should feel like the same design system, not two different card treatments.

- [ ] **Step 6: Commit**

```bash
git add src/app/services/page.tsx src/app/routes.test.tsx
git commit -m "feat: build real Services index page"
```

---

### Task 13: Service sub-pages (5 pages)

**Files:**
- Modify: `src/app/services/interior-painting/page.tsx`
- Modify: `src/app/services/cabinetpainting/page.tsx`
- Modify: `src/app/services/minor-restoration/page.tsx`
- Modify: `src/app/services/wallpaper/page.tsx`
- Modify: `src/app/services/colorconsult/page.tsx`
- Modify: `src/app/routes.test.tsx`

**Interfaces:**
- Consumes: `getServiceBySlug`, `getPortfolioProjectsByCategory` (Task 3), `PortfolioCard` (Task 5)

These 5 pages share one template exactly — each fetches its own service by a fixed slug, and (except Color Consultation, which has no matching photos yet) fetches matching portfolio photos by a fixed category. The only things that differ per page are the `slug` and `category` constants.

- [ ] **Step 1: Update the failing test**

Update the shared mocks (from Task 8) to also cover `getServiceBySlug` and `getPortfolioProjectsByCategory`:

```ts
getServiceBySlug: jest.fn().mockResolvedValue({
  title: 'Interior Painting',
  slug: { current: 'interior-painting' },
  summary: 'A fresh coat for any room.',
}),
getPortfolioProjectsByCategory: jest.fn().mockResolvedValue([]),
```

The 5 service sub-page entries in `pages` already have their own expected regexes (`/interior painting/i`, `/cabinet/i`, `/restoration/i`, `/wallpaper/i`, `/color consult/i`) from the Site Foundation plan — those still apply since each page's `<h1>` will render the fetched service's title (mocked above as "Interior Painting" for all 5 in this shared mock, which is fine for this shared-mock test file; the real page fetches its own correct slug in the actual app).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/routes.test.tsx`
Expected: FAIL — all 5 pages are still bare `<h1>` placeholders

- [ ] **Step 3: Implement the 5 service sub-pages**

Create `src/app/services/interior-painting/page.tsx`:

```tsx
import { getServiceBySlug, getPortfolioProjectsByCategory } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import PortfolioCard from '@/components/portfolio-card'
import { Section } from '@/components/ui/section'

const SLUG = 'interior-painting'
const CATEGORY = 'Interior Painting'

export default async function InteriorPaintingPage() {
  const [service, projects] = await Promise.all([
    getServiceBySlug(SLUG),
    getPortfolioProjectsByCategory(CATEGORY),
  ])

  return (
    <Section>
      {service?.heroImage && (
        <img
          src={urlForImage(service.heroImage).width(1200).height(600).url()}
          alt={service.title}
          className="mb-8 h-64 w-full object-cover grayscale md:h-96"
        />
      )}
      <h1 className="text-4xl">{service?.title ?? 'Interior Painting'}</h1>
      {service?.summary && <p className="mt-4 max-w-2xl text-gray-400">{service.summary}</p>}

      {projects.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl">Recent Projects</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <PortfolioCard key={i} project={p} />
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}
```

Create `src/app/services/cabinetpainting/page.tsx` — identical structure, with `SLUG = 'cabinetpainting'`, `CATEGORY = 'Cabinet Painting'`, function name `CabinetPaintingPage`, and fallback title `'Cabinet Painting'`:

```tsx
import { getServiceBySlug, getPortfolioProjectsByCategory } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import PortfolioCard from '@/components/portfolio-card'
import { Section } from '@/components/ui/section'

const SLUG = 'cabinetpainting'
const CATEGORY = 'Cabinet Painting'

export default async function CabinetPaintingPage() {
  const [service, projects] = await Promise.all([
    getServiceBySlug(SLUG),
    getPortfolioProjectsByCategory(CATEGORY),
  ])

  return (
    <Section>
      {service?.heroImage && (
        <img
          src={urlForImage(service.heroImage).width(1200).height(600).url()}
          alt={service.title}
          className="mb-8 h-64 w-full object-cover grayscale md:h-96"
        />
      )}
      <h1 className="text-4xl">{service?.title ?? 'Cabinet Painting'}</h1>
      {service?.summary && <p className="mt-4 max-w-2xl text-gray-400">{service.summary}</p>}

      {projects.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl">Recent Projects</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <PortfolioCard key={i} project={p} />
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}
```

Create `src/app/services/minor-restoration/page.tsx` — `SLUG = 'minor-restoration'`, `CATEGORY = 'Restoration'`, function name `MinorRestorationPage`, fallback title `'Restoration'` (same body structure as above, just these 4 values changed).

Create `src/app/services/wallpaper/page.tsx` — `SLUG = 'wallpaper'`, `CATEGORY = 'Wallpaper & Faux Finishes'`, function name `WallpaperPage`, fallback title `'Wallpaper & Faux Finishes'` (same body structure).

Create `src/app/services/colorconsult/page.tsx` — this one has no matching portfolio category (no photos exist yet for Color Consultation), so it skips the portfolio fetch entirely rather than querying a category that will always return empty:

```tsx
import { getServiceBySlug } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'
import { Section } from '@/components/ui/section'

const SLUG = 'colorconsult'

export default async function ColorConsultPage() {
  const service = await getServiceBySlug(SLUG)

  return (
    <Section>
      {service?.heroImage && (
        <img
          src={urlForImage(service.heroImage).width(1200).height(600).url()}
          alt={service.title}
          className="mb-8 h-64 w-full object-cover grayscale md:h-96"
        />
      )}
      <h1 className="text-4xl">{service?.title ?? 'Color Consultation'}</h1>
      {service?.summary && <p className="mt-4 max-w-2xl text-gray-400">{service.summary}</p>}
    </Section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/routes.test.tsx`
Expected: PASS for all 5 service sub-page cases

- [ ] **Step 5: Manually verify in the browser**

```bash
npm run dev
```

Visit each of the 5 service URLs and confirm the correct real service title/hero image renders per page (not all showing "Interior Painting" — that was only the shared unit-test mock, the real app fetches each page's own real slug).

- [ ] **Step 6: Art-direct the pages**

Invoke the `frontend-design` skill once against this shared template (since all 5 pages use the identical structure, one design pass covers all of them) to refine the hero/description/portfolio-grid layout.

- [ ] **Step 7: Commit**

```bash
git add src/app/services/interior-painting/page.tsx src/app/services/cabinetpainting/page.tsx src/app/services/minor-restoration/page.tsx src/app/services/wallpaper/page.tsx src/app/services/colorconsult/page.tsx src/app/routes.test.tsx
git commit -m "feat: build real service sub-pages with matching portfolio photos"
```

---

### Task 14: Portfolio page

**Files:**
- Modify: `src/app/portfolio/page.tsx`
- Modify: `src/app/routes.test.tsx`

**Interfaces:**
- Consumes: `getPortfolioProjects` (Task 3), `PortfolioCard` (Task 5)

- [ ] **Step 1: Update the failing test**

Update the shared `getPortfolioProjects` mock (from Task 8) to return real-shaped data:

```ts
getPortfolioProjects: jest.fn().mockResolvedValue([
  { title: 'Modern kitchen with white cabinets' },
  { title: 'Elegant spiral staircase' },
]),
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/routes.test.tsx`
Expected: FAIL — current page is a bare `<h1>Portfolio</h1>`

- [ ] **Step 3: Implement the Portfolio page**

Replace `src/app/portfolio/page.tsx`:

```tsx
import { getPortfolioProjects } from '@/lib/sanity/queries'
import PortfolioCard from '@/components/portfolio-card'
import { Section } from '@/components/ui/section'

export default async function PortfolioPage() {
  const projects = await getPortfolioProjects()

  return (
    <Section>
      <h1 className="text-4xl">Portfolio</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <PortfolioCard key={i} project={p} />
        ))}
      </div>
    </Section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/routes.test.tsx`
Expected: PASS for the Portfolio case

- [ ] **Step 5: Art-direct the page**

Invoke the `frontend-design` skill to make a 4-project gallery feel intentional and complete at this size — per the spec, this should not look like a page waiting for more content.

- [ ] **Step 6: Commit**

```bash
git add src/app/portfolio/page.tsx src/app/routes.test.tsx
git commit -m "feat: build real Portfolio page"
```

---

### Task 15: Contact page

**Files:**
- Modify: `src/app/contact/page.tsx`
- Modify: `src/app/routes.test.tsx`

**Interfaces:**
- Consumes: `getSiteSettings` (Task 3)

- [ ] **Step 1: Update the failing test**

Update the shared `getSiteSettings` mock (from Task 8) to return real-shaped data:

```ts
getSiteSettings: jest.fn().mockResolvedValue({
  contactPhone: '412-427-6873',
  contactEmail: 'theproperpainterllc@gmail.com',
}),
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/routes.test.tsx`
Expected: FAIL — current page is a bare `<h1>Contact</h1>`

- [ ] **Step 3: Implement the Contact page**

Replace `src/app/contact/page.tsx`:

```tsx
import { getSiteSettings } from '@/lib/sanity/queries'
import { Section } from '@/components/ui/section'

export default async function ContactPage() {
  const settings = await getSiteSettings()

  return (
    <Section>
      <h1 className="text-4xl">Contact Us</h1>
      <div className="mt-6 grid gap-12 md:grid-cols-2">
        <div className="text-gray-400">
          {settings?.contactPhone && <p>Phone: {settings.contactPhone}</p>}
          {settings?.contactEmail && <p className="mt-2">Email: {settings.contactEmail}</p>}
        </div>

        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-gray-400">
              Name
            </label>
            <input id="name" name="name" type="text" className="mt-1 w-full border border-gray-800 bg-background p-2" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-gray-400">
              Email
            </label>
            <input id="email" name="email" type="email" className="mt-1 w-full border border-gray-800 bg-background p-2" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm text-gray-400">
              Message
            </label>
            <textarea id="message" name="message" rows={4} className="mt-1 w-full border border-gray-800 bg-background p-2" />
          </div>
          <button type="submit" className="border border-foreground px-6 py-3 text-sm hover:bg-foreground hover:text-background">
            Send
          </button>
        </form>
      </div>
    </Section>
  )
}
```

(This form has no `onSubmit`/backend wiring yet — per the spec, DripJobs integration is a later plan. It's visually complete and accessible now.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/routes.test.tsx`
Expected: PASS for the Contact case

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: ALL cases in `routes.test.tsx` now pass (every page has been converted across Tasks 8-15) — this is the first point where the whole file is green again after being red mid-plan; confirm this explicitly.

- [ ] **Step 6: Art-direct the page**

Invoke the `frontend-design` skill to refine the two-column contact/form layout.

- [ ] **Step 7: Manually verify mobile responsiveness across the whole site**

```bash
npm run dev
```

Using your browser's device toolbar (or by resizing the window to ~375px wide), visit all 12 routes and confirm: the Header's hamburger menu works and every nav link is reachable, no content overflows horizontally, images scale down instead of overflowing, and the site generally looks intentional at phone width — not just usable, but designed for it. This is the spec's explicit mobile requirement and this is the first point in the plan where every page is real, so it's the right place to check the whole site at once rather than page by page.

- [ ] **Step 8: Commit**

```bash
git add src/app/contact/page.tsx src/app/routes.test.tsx
git commit -m "feat: build real Contact page with visual form"
```

---

## What this plan does NOT cover

- DripJobs form wiring (a later plan)
- A real headshot photo for Elizabeth
- Mobile-specific interaction polish beyond a working responsive layout
- Any new photography beyond what's already in Sanity
- Launch QA / DNS cutover (a later plan)
