# Site Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a working, deployed skeleton of The Proper Painter's new site — Next.js app, grayscale design system, shadcn/ui primitives, Sanity CMS wired in with content schemas defined, and a placeholder page for every route in the site map — live on a Vercel staging URL.

**Architecture:** A single Next.js (App Router) project with an embedded Sanity Studio route (`/studio`). Tailwind CSS supplies the grayscale-only design tokens; shadcn/ui supplies unstyled, accessible component behavior that later plans re-skin. This plan wires the skeleton only — no real content, no page-specific design, no DripJobs integration. Those are separate follow-on plans (content/asset migration, page-by-page build, and lead-capture integration).

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, shadcn/ui, Sanity (`sanity` + `next-sanity`), Jest + React Testing Library, Vercel (hosting).

**Spec:** `docs/superpowers/specs/2026-09-04-new-site-design.md`

## Global Constraints

- Frontend framework: Next.js (App Router), deployed on Vercel
- CMS: Sanity (headless)
- Styling: Tailwind CSS + shadcn/ui primitives only — never shadcn's default visual theme
- Visual direction: pure black-and-white / grayscale — **no accent color anywhere**
- Site map (must exist as routes, mirroring the live site 1:1): `/`, `/about`, `/portfolio`, `/team`, `/contact`, `/services`, `/services/interior-painting`, `/services/cabinetpainting`, `/services/minor-restoration`, `/services/wallpaper`, `/services/colorconsult`
- Content model (Sanity schemas): `service`, `portfolioProject`, `testimonial`, `teamMember`, `siteSettings`

---

### Task 1: Scaffold the Next.js project and test harness

**Files:**
- Create: entire Next.js scaffold (`package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.eslintrc.json`)
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Test: `src/lib/sanity-check.test.ts`

**Interfaces:**
- Produces: a working `npm test` command using Jest + React Testing Library + jsdom, available to every later task in this plan.

- [ ] **Step 1: Scaffold the app**

Run from `C:\Users\El_Gu\Projects\ProperPainter` (the repo root, which already contains `docs/` and `.git`):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

If it prompts about the directory not being empty, confirm — `docs/` and `.git` won't conflict with anything it generates.

- [ ] **Step 2: Install test dependencies**

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/dom @types/jest ts-node
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:

```ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:

```json
"test": "jest"
```

- [ ] **Step 4: Write a trivial failing test to prove the harness works**

Create `src/lib/sanity-check.test.ts`:

```ts
describe('test harness', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(3)
  })
})
```

- [ ] **Step 5: Run it and confirm it fails**

Run: `npm test`
Expected: FAIL — `expect(received).toBe(expected)` with `2 !== 3`

- [ ] **Step 6: Fix the assertion**

```ts
describe('test harness', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 7: Run it and confirm it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Jest test harness"
```

---

### Task 2: Grayscale design tokens

**Files:**
- Modify: `tailwind.config.ts`
- Test: `tailwind.config.test.ts`

**Interfaces:**
- Produces: Tailwind color tokens `background` (`#000000`), `foreground` (`#ffffff`), and a `gray` scale (`gray-50` through `gray-950`) — every later component task uses these tokens, never raw hex values or any hue-based color.

- [ ] **Step 1: Write the failing test**

Create `tailwind.config.test.ts`:

```ts
import config from './tailwind.config'

describe('tailwind config', () => {
  it('defines a pure black background and white foreground token', () => {
    const colors = (config.theme?.extend?.colors ?? {}) as Record<string, string>
    expect(colors.background).toBe('#000000')
    expect(colors.foreground).toBe('#ffffff')
  })

  it('defines a full grayscale ramp with no accent hue', () => {
    const colors = (config.theme?.extend?.colors ?? {}) as Record<string, Record<string, string> | string>
    const gray = colors.gray as Record<string, string>
    const expectedSteps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
    for (const step of expectedSteps) {
      expect(gray[step]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tailwind.config.test.ts`
Expected: FAIL — `colors.background` is `undefined`

- [ ] **Step 3: Add the tokens to `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tailwind.config.test.ts`
Expected: PASS

- [ ] **Step 5: Set the default background/text color in `src/app/globals.css`**

Add near the top, after the Tailwind directives:

```css
body {
  background-color: theme('colors.background');
  color: theme('colors.foreground');
}
```

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts tailwind.config.test.ts src/app/globals.css
git commit -m "feat: add grayscale-only design tokens"
```

---

### Task 3: Install shadcn/ui primitives

**Files:**
- Create: `components.json`, `src/lib/utils.ts` (generated by shadcn CLI)
- Test: `src/lib/utils.test.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `@/lib/utils` — every component built in later tasks/plans uses this for conditional class names instead of string concatenation.

- [ ] **Step 1: Run the shadcn init**

```bash
npx shadcn@latest init -d
```

Use these answers if prompted interactively: base color **Neutral**, CSS variables **Yes**.

- [ ] **Step 2: Write the failing test**

Create `src/lib/utils.test.ts`:

```ts
import { cn } from './utils'

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts (last wins)', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('drops falsy values', () => {
    expect(cn('block', false && 'hidden', undefined, 'text-white')).toBe('block text-white')
  })
})
```

- [ ] **Step 3: Run test to verify it fails or passes**

Run: `npm test -- src/lib/utils.test.ts`
Expected: PASS if `shadcn init` generated the standard `cn` implementation (`clsx` + `tailwind-merge`) — if it fails, check `src/lib/utils.ts` matches:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: Add the first primitive (Button) for later tasks to build on**

```bash
npx shadcn@latest add button
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: install shadcn/ui primitives"
```

---

### Task 4: Header (nav) component

**Files:**
- Create: `src/components/layout/header.tsx`
- Test: `src/components/layout/header.test.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` (Task 3)
- Produces: `Header` default export from `@/components/layout/header` — consumed by the root layout in Task 6.

- [ ] **Step 1: Write the failing test**

Create `src/components/layout/header.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import Header from './header'

describe('Header', () => {
  it('renders a link to every top-level site section', () => {
    render(<Header />)
    const expected: [RegExp, string][] = [
      [/^home$/i, '/'],
      [/^about$/i, '/about'],
      [/^services$/i, '/services'],
      [/^portfolio$/i, '/portfolio'],
      [/^team$/i, '/team'],
      [/^contact$/i, '/contact'],
    ]
    for (const [name, href] of expected) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- header.test.tsx`
Expected: FAIL — cannot find module `./header`

- [ ] **Step 3: Implement the component**

Create `src/components/layout/header.tsx`:

```tsx
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/team', label: 'Team' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-background">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-wide text-foreground">
          The Proper Painter
        </Link>
        <ul className="flex gap-6">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm text-foreground hover:text-gray-400">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- header.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/header.tsx src/components/layout/header.test.tsx
git commit -m "feat: add site Header component"
```

---

### Task 5: Footer component

**Files:**
- Create: `src/components/layout/footer.tsx`
- Test: `src/components/layout/footer.test.tsx`

**Interfaces:**
- Produces: `Footer` default export from `@/components/layout/footer` — consumed by the root layout in Task 6.

- [ ] **Step 1: Write the failing test**

Create `src/components/layout/footer.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import Footer from './footer'

describe('Footer', () => {
  it('identifies the business as women-owned and operated', () => {
    render(<Footer />)
    expect(screen.getByText(/women-owned/i)).toBeInTheDocument()
  })

  it('includes the current year in a copyright line', () => {
    render(<Footer />)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- footer.test.tsx`
Expected: FAIL — cannot find module `./footer`

- [ ] **Step 3: Implement the component**

Create `src/components/layout/footer.tsx`:

```tsx
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-800 bg-background py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 text-sm text-gray-400">
        <p className="text-foreground">
          The Proper Painter — Women-Owned &amp; Operated, Fully Insured Licensed Contractor
        </p>
        <p>&copy; {year} The Proper Painter. All rights reserved.</p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- footer.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/footer.tsx src/components/layout/footer.test.tsx
git commit -m "feat: add site Footer component"
```

---

### Task 6: Root layout and placeholder pages for every route

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/about/page.tsx`
- Create: `src/app/portfolio/page.tsx`
- Create: `src/app/team/page.tsx`
- Create: `src/app/contact/page.tsx`
- Create: `src/app/services/page.tsx`
- Create: `src/app/services/interior-painting/page.tsx`
- Create: `src/app/services/cabinetpainting/page.tsx`
- Create: `src/app/services/minor-restoration/page.tsx`
- Create: `src/app/services/wallpaper/page.tsx`
- Create: `src/app/services/colorconsult/page.tsx`
- Test: `src/app/routes.test.tsx`

**Interfaces:**
- Consumes: `Header` (Task 4), `Footer` (Task 5)
- Produces: every route from the Global Constraints site map resolves to a page rendering at least one `<h1>` — later plans replace these bodies with real content but keep the same file paths and default export shape (`export default function PageName()`).

- [ ] **Step 1: Write the failing test**

Create `src/app/routes.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
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

const pages: [string, () => JSX.Element, RegExp][] = [
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- routes.test.tsx`
Expected: FAIL — cannot find module `./about/page` (and the rest)

- [ ] **Step 3: Implement the root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Proper Painter | Women-Owned Interior Painting',
  description: 'Women-owned and operated interior painting, cabinet painting, restoration, wallpaper, and color consultation.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Implement each placeholder page**

`src/app/page.tsx`:

```tsx
export default function HomePage() {
  return <h1 className="px-6 py-24 text-4xl font-semibold">The Proper Painter</h1>
}
```

`src/app/about/page.tsx`:

```tsx
export default function AboutPage() {
  return <h1 className="px-6 py-24 text-4xl font-semibold">About</h1>
}
```

`src/app/portfolio/page.tsx`:

```tsx
export default function PortfolioPage() {
  return <h1 className="px-6 py-24 text-4xl font-semibold">Portfolio</h1>
}
```

`src/app/team/page.tsx`:

```tsx
export default function TeamPage() {
  return <h1 className="px-6 py-24 text-4xl font-semibold">Team</h1>
}
```

`src/app/contact/page.tsx`:

```tsx
export default function ContactPage() {
  return <h1 className="px-6 py-24 text-4xl font-semibold">Contact</h1>
}
```

`src/app/services/page.tsx`:

```tsx
export default function ServicesPage() {
  return <h1 className="px-6 py-24 text-4xl font-semibold">Services</h1>
}
```

`src/app/services/interior-painting/page.tsx`:

```tsx
export default function InteriorPaintingPage() {
  return <h1 className="px-6 py-24 text-4xl font-semibold">Interior Painting</h1>
}
```

`src/app/services/cabinetpainting/page.tsx`:

```tsx
export default function CabinetPaintingPage() {
  return <h1 className="px-6 py-24 text-4xl font-semibold">Cabinet Painting</h1>
}
```

`src/app/services/minor-restoration/page.tsx`:

```tsx
export default function MinorRestorationPage() {
  return <h1 className="px-6 py-24 text-4xl font-semibold">Restoration</h1>
}
```

`src/app/services/wallpaper/page.tsx`:

```tsx
export default function WallpaperPage() {
  return <h1 className="px-6 py-24 text-4xl font-semibold">Wallpaper &amp; Faux Finishes</h1>
}
```

`src/app/services/colorconsult/page.tsx`:

```tsx
export default function ColorConsultPage() {
  return <h1 className="px-6 py-24 text-4xl font-semibold">Color Consultation</h1>
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- routes.test.tsx`
Expected: PASS (11 cases)

- [ ] **Step 6: Start the dev server and manually confirm every route resolves with the header/footer visible**

```bash
npm run dev
```

Visit each URL from the Global Constraints site map at `http://localhost:3000` and confirm the header nav and footer render on every page.

- [ ] **Step 7: Commit**

```bash
git add src/app
git commit -m "feat: wire root layout and placeholder pages for every site route"
```

---

### Task 7: Create the Sanity project and install Sanity into the app

**This task starts with a manual step — it needs a human's Sanity account login and cannot be scripted by an agent.**

- [ ] **Step 1 (MANUAL — human required): Create the Sanity project**

The user (Tommy or Elizabeth) runs, in an interactive terminal with browser access:

```bash
npm create sanity@latest -- --project-name "The Proper Painter" --dataset production --template clean --typescript
```

When prompted, log in via the browser flow. Note the **Project ID** it prints — the next steps need it. If this creates Sanity's files in a separate directory, move the generated `sanity.config.ts`, `sanity.cli.ts`, and `schemaTypes/` folder into this repo's root (or `src/sanity/`) rather than keeping a second project directory.

**Files:**
- Create: `sanity.config.ts`
- Create: `sanity.cli.ts`
- Create: `src/app/studio/[[...tool]]/page.tsx`
- Create: `.env.local` (not committed — see `.gitignore`)
- Create: `.env.local.example`
- Test: `sanity.config.test.ts`

**Interfaces:**
- Produces: `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` environment variables — consumed by the Sanity client in Task 9 and by every future content-fetching task.

- [ ] **Step 2: Install the Next.js integration packages**

```bash
npm install sanity next-sanity @sanity/vision
```

- [ ] **Step 3: Write the failing test**

Create `sanity.config.test.ts`:

```ts
import config from './sanity.config'

describe('sanity config', () => {
  it('is configured with a project ID and dataset', () => {
    expect(config.projectId).toBeTruthy()
    expect(config.dataset).toBe('production')
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- sanity.config.test.ts`
Expected: FAIL — `sanity.config.ts` doesn't exist yet (or doesn't export project ID/dataset in the expected shape)

- [ ] **Step 5: Write `sanity.config.ts`**

```ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'The Proper Painter',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
})
```

Create an empty schema index for now (populated fully in Task 8):

```ts
// src/sanity/schemaTypes/index.ts
import type { SchemaTypeDefinition } from 'sanity'

export const schemaTypes: SchemaTypeDefinition[] = []
```

- [ ] **Step 6: Add the env vars**

Create `.env.local` (replace `<your-project-id>` with the ID from Step 1 — this file must NOT be committed):

```
NEXT_PUBLIC_SANITY_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_SANITY_DATASET=production
```

Create `.env.local.example` (this one IS committed):

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
```

Confirm `.gitignore` already contains `.env*.local` (create-next-app adds this by default — check before adding a duplicate).

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- sanity.config.test.ts`
Expected: PASS

- [ ] **Step 8: Embed Sanity Studio at `/studio`**

Create `src/app/studio/[[...tool]]/page.tsx`:

```tsx
'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

- [ ] **Step 9: Manually verify Studio loads**

```bash
npm run dev
```

Visit `http://localhost:3000/studio` and confirm the Sanity Studio UI loads (it will show an empty schema until Task 8).

- [ ] **Step 10: Commit**

```bash
git add sanity.config.ts sanity.cli.ts src/sanity src/app/studio .env.local.example .gitignore package.json package-lock.json
git commit -m "feat: install Sanity and embed Studio at /studio"
```

---

### Task 8: Define Sanity content schemas

**Files:**
- Create: `src/sanity/schemaTypes/service.ts`
- Create: `src/sanity/schemaTypes/portfolioProject.ts`
- Create: `src/sanity/schemaTypes/testimonial.ts`
- Create: `src/sanity/schemaTypes/teamMember.ts`
- Create: `src/sanity/schemaTypes/siteSettings.ts`
- Modify: `src/sanity/schemaTypes/index.ts`
- Test: `src/sanity/schemaTypes/schema.test.ts`

**Interfaces:**
- Produces: five named schema exports (`service`, `portfolioProject`, `testimonial`, `teamMember`, `siteSettings`), each a `SchemaTypeDefinition` with a `name` matching its export name — later content-fetching code (Plan 2) queries Sanity using these exact type names in GROQ (`*[_type == "service"]`, etc.).

- [ ] **Step 1: Write the failing test**

Create `src/sanity/schemaTypes/schema.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- schema.test.ts`
Expected: FAIL — `schemaTypes` is an empty array

- [ ] **Step 3: Implement each schema**

`src/sanity/schemaTypes/service.ts`:

```ts
import { defineField, defineType } from 'sanity'

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'summary', title: 'Summary', type: 'text' }),
    defineField({ name: 'heroImage', title: 'Hero Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'gallery', title: 'Gallery', type: 'array', of: [{ type: 'image', options: { hotspot: true } }] }),
    defineField({ name: 'order', title: 'Display Order', type: 'number' }),
  ],
})
```

`src/sanity/schemaTypes/portfolioProject.ts`:

```ts
import { defineField, defineType } from 'sanity'

export const portfolioProject = defineType({
  name: 'portfolioProject',
  title: 'Portfolio Project',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string' }),
    defineField({ name: 'beforeImage', title: 'Before Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'afterImage', title: 'After Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
  ],
})
```

`src/sanity/schemaTypes/testimonial.ts`:

```ts
import { defineField, defineType } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'quote', title: 'Quote', type: 'text', validation: (Rule) => Rule.required() }),
    defineField({ name: 'author', title: 'Author', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      options: { list: ["Angie's List", 'Google', 'Direct'] },
    }),
  ],
})
```

`src/sanity/schemaTypes/teamMember.ts`:

```ts
import { defineField, defineType } from 'sanity'

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'bio', title: 'Bio', type: 'text' }),
    defineField({ name: 'photo', title: 'Photo', type: 'image', options: { hotspot: true } }),
  ],
})
```

`src/sanity/schemaTypes/siteSettings.ts`:

```ts
import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'contactEmail', title: 'Contact Email', type: 'string' }),
    defineField({ name: 'contactPhone', title: 'Contact Phone', type: 'string' }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'platform', type: 'string' },
        { name: 'url', type: 'url' },
      ] }],
    }),
  ],
})
```

`src/sanity/schemaTypes/index.ts`:

```ts
import type { SchemaTypeDefinition } from 'sanity'
import { service } from './service'
import { portfolioProject } from './portfolioProject'
import { testimonial } from './testimonial'
import { teamMember } from './teamMember'
import { siteSettings } from './siteSettings'

export const schemaTypes: SchemaTypeDefinition[] = [
  service,
  portfolioProject,
  testimonial,
  teamMember,
  siteSettings,
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- schema.test.ts`
Expected: PASS (6 cases)

- [ ] **Step 5: Manually verify in Studio**

```bash
npm run dev
```

Visit `http://localhost:3000/studio` and confirm all five document types appear in the left sidebar and each can open an empty "create new" form with the expected fields.

- [ ] **Step 6: Commit**

```bash
git add src/sanity/schemaTypes
git commit -m "feat: define Sanity content schemas for service, portfolioProject, testimonial, teamMember, siteSettings"
```

---

### Task 9: Typed Sanity client and fetch helper

**Files:**
- Create: `src/lib/sanity/client.ts`
- Create: `src/lib/sanity/client.test.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` (Task 7)
- Produces: `sanityClient` (a configured `next-sanity` client instance) and `sanityFetch<T>(query: string, params?: Record<string, unknown>): Promise<T>` from `@/lib/sanity/client` — every content-fetching task in the next plan (page-by-page build) imports `sanityFetch` to query content by the schema type names from Task 8.

- [ ] **Step 1: Write the failing test**

Create `src/lib/sanity/client.test.ts`:

```ts
jest.mock('next-sanity', () => ({
  createClient: jest.fn(() => ({ fetch: jest.fn().mockResolvedValue({ ok: true }) })),
}))

import { createClient } from 'next-sanity'
import { sanityClient, sanityFetch } from './client'

describe('sanityClient', () => {
  it('is created with the project ID and dataset from env vars', () => {
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        useCdn: true,
      })
    )
  })
})

describe('sanityFetch', () => {
  it('delegates to the underlying client fetch and returns its result', async () => {
    const result = await sanityFetch<{ ok: boolean }>('*[_type == "service"]')
    expect(result).toEqual({ ok: true })
    expect(sanityClient.fetch).toHaveBeenCalledWith('*[_type == "service"]', {})
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/sanity/client.test.ts`
Expected: FAIL — cannot find module `./client`

- [ ] **Step 3: Implement the client**

Create `src/lib/sanity/client.ts`:

```ts
import { createClient } from 'next-sanity'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2026-09-04',
  useCdn: true,
})

export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  return sanityClient.fetch<T>(query, params)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/sanity/client.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/sanity
git commit -m "feat: add typed Sanity client and fetch helper"
```

---

### Task 10: Deploy to Vercel staging

**This task starts with a manual step — it needs a human's Vercel account login and cannot be scripted by an agent.**

**Files:**
- Create: `e2e/staging-smoke.test.ts`

**Interfaces:**
- Produces: a reachable staging URL (e.g. `https://proper-painter-<hash>.vercel.app`) — the launch/QA plan (a later plan) uses this same URL for its Lighthouse and URL-parity checks.

- [ ] **Step 1 (MANUAL — human required): Log in and link the project**

```bash
npx vercel login
npx vercel link
```

Follow the interactive prompts (choose/create the "proper-painter" project under the correct Vercel account/team).

- [ ] **Step 2 (MANUAL — human required): Add the Sanity env vars to Vercel**

```bash
npx vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID
npx vercel env add NEXT_PUBLIC_SANITY_DATASET
```

Paste in the same values from `.env.local` when prompted, for the "Preview" and "Production" environments.

- [ ] **Step 3: Deploy a preview build**

```bash
npx vercel
```

Note the preview URL it prints (e.g. `https://proper-painter-xyz123.vercel.app`).

- [ ] **Step 4: Write the smoke test against the live staging URL**

Create `e2e/staging-smoke.test.ts` (uses global `fetch`, no extra dependency needed):

```ts
const STAGING_URL = process.env.STAGING_URL

describe('staging deployment', () => {
  it('responds 200 on every site-map route', async () => {
    if (!STAGING_URL) {
      throw new Error('Set STAGING_URL to the Vercel preview URL before running this test')
    }
    const routes = [
      '/',
      '/about',
      '/portfolio',
      '/team',
      '/contact',
      '/services',
      '/services/interior-painting',
      '/services/cabinetpainting',
      '/services/minor-restoration',
      '/services/wallpaper',
      '/services/colorconsult',
    ]
    for (const route of routes) {
      const res = await fetch(`${STAGING_URL}${route}`)
      expect(res.status).toBe(200)
    }
  })
})
```

- [ ] **Step 5: Run the smoke test against the real preview URL**

```bash
STAGING_URL=https://proper-painter-xyz123.vercel.app npm test -- e2e/staging-smoke.test.ts
```

(Replace with the actual URL from Step 3.) Expected: PASS — all 11 routes return 200.

- [ ] **Step 6: Commit**

```bash
git add e2e/staging-smoke.test.ts
git commit -m "test: add staging deployment smoke test"
```

---

## What this plan does NOT cover (deliberately — see spec's "Out of scope" and follow-on plans)

- Real content/photos (placeholder `<h1>` only) — covered by a future content & asset migration plan
- Page-specific design (grayscale gallery layouts, typography treatment via `frontend-design`/`ui-ux-pro-max`) — covered by a future page-by-page build plan
- Angie's List testimonial data entry
- DripJobs/Zapier lead-capture integration
- DNS cutover from the live site
