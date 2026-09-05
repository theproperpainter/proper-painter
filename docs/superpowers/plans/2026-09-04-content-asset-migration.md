# Content & Asset Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the Sanity CMS (schemas already defined in the Site Foundation plan) with real content from the live site: 27 real testimonials, real photos organized into portfolio projects and service galleries, the real logo asset, real contact/social info, and Elizabeth's real bio — with zero frontend page changes.

**Architecture:** A one-off Node/TypeScript migration script, run locally and never deployed, using Playwright to crawl the live site for real image URLs (the live site lazy-loads all images via JS, so a plain HTTP fetch only returns placeholder GIFs) and a Sanity client authenticated with a write-scoped API token to create/update documents. The pure data-transformation logic (review data shape, category inference from image alt text, document-builder functions) is unit tested; the actual crawl/upload/write network operations are verified by running them for real against the live site and the real Sanity project, since there is no meaningful way to mock a full browser crawl or a real CMS write without testing nothing of value.

**Tech Stack:** Node.js, TypeScript, Playwright (already a project dependency via `playwright-skill`/browser tooling — install `playwright` as a script-only devDependency if not already resolvable), `@sanity/client` (a write-capable client, separate from the app's read-only `next-sanity` client), Jest (for the pure-logic unit tests).

**Spec:** `docs/superpowers/specs/2026-09-04-content-asset-migration-design.md`

**Correction found during planning:** the spec's source-site audit mentioned "2 extra reviews beyond HomeAdvisor's 23" (Michele S., Robyn F.). A full re-crawl of the HomeAdvisor listing found Michele S.'s review is already one of the 23 (just missed in the spec-time partial capture). The actual extra set, found only on the live site's own reviews page and not on HomeAdvisor, is 4 reviews: Denise, Samantha S., Mary Pat L., and Robyn F. Total testimonial count is **27**, not 25. This plan uses the corrected, complete data below.

## Global Constraints

- Scope: backend/CMS content only — no Next.js page/template changes in this plan
- Content model: the 5 existing schemas (`service`, `portfolioProject`, `testimonial`, `teamMember`, `siteSettings`) are not restructured — this plan only creates/updates documents, with one small necessary addition: a `logo` image field on `siteSettings` to hold the real brand asset (the spec calls for pulling the real logo graphic; no field existed to hold it)
- Reviews: 23 from HomeAdvisor (source tag `"HomeAdvisor"`) + 4 from the live site (source tag `"Direct"`) = 27 total
- Portfolio images: `afterImage` only for this plan; `beforeImage` stays empty
- Contact info: phone `412-427-6873`, email `theproperpainterllc@gmail.com`
- Social links: HomeAdvisor listing, Facebook (`facebook.com/theproperpainterllc`), Instagram (`instagram.com/theproperpainterllc`), Google reviews (`https://g.page/r/CQ7RtRHDEUczEAE/review`) — no Publuu link (dead, HTTP 410)
- Requires a Sanity API token with write access (human-generated, cannot be automated) — see Task 1

---

### Task 1: Sanity write client + manual token setup

**This task starts with a manual step — it needs a human to generate a Sanity API token and cannot be scripted by an agent.**

- [ ] **Step 1 (MANUAL — human required): Generate a Sanity API token**

Go to https://sanity.io/manage, select the project (ID `nqr6djox`), go to API → Tokens → Add API token. Name it something like "content-migration", set permissions to **Editor** (write access), and copy the generated token — it is shown only once.

**Files:**
- Create: `scripts/migrate/sanity-write-client.ts`
- Create: `scripts/migrate/sanity-write-client.test.ts`
- Modify: `.env.local` (not committed — add `SANITY_API_TOKEN=<the token>`)
- Modify: `.env.local.example` (committed — add `SANITY_API_TOKEN=` with no value)

**Interfaces:**
- Produces: `sanityWriteClient` (a configured `@sanity/client` instance with write access) from `scripts/migrate/sanity-write-client.ts` — every later task in this plan imports this to create/update documents.

- [ ] **Step 2: Install the write client package**

```bash
npm install @sanity/client
```

(`next-sanity`, already installed, wraps `@sanity/client` for the read-only app client — this is a separate, explicit write-capable client for migration scripts only, never imported by the Next.js app itself.)

- [ ] **Step 3: Write the failing test**

Create `scripts/migrate/sanity-write-client.test.ts`:

```ts
jest.mock('@sanity/client', () => ({
  createClient: jest.fn(() => ({ create: jest.fn(), createOrReplace: jest.fn() })),
}))

import { createClient } from '@sanity/client'
import { sanityWriteClient } from './sanity-write-client'

describe('sanityWriteClient', () => {
  it('is created with the project ID, dataset, and a write token', () => {
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        token: process.env.SANITY_API_TOKEN,
        useCdn: false,
      })
    )
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- scripts/migrate/sanity-write-client.test.ts`
Expected: FAIL — cannot find module `./sanity-write-client`

- [ ] **Step 5: Implement the client**

Create `scripts/migrate/sanity-write-client.ts`:

```ts
import { createClient } from '@sanity/client'

export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2026-09-04',
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
})
```

- [ ] **Step 6: Add the env var placeholders**

Add to `.env.local` (not committed, real token from Step 1):

```
SANITY_API_TOKEN=<the token from Step 1>
```

Add to `.env.local.example` (committed):

```
SANITY_API_TOKEN=
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- scripts/migrate/sanity-write-client.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add scripts/migrate/sanity-write-client.ts scripts/migrate/sanity-write-client.test.ts .env.local.example package.json package-lock.json
git commit -m "feat: add write-capable Sanity client for migration scripts"
```

---

### Task 2: Real testimonial data module

**Files:**
- Create: `scripts/migrate/reviews-data.ts`
- Create: `scripts/migrate/reviews-data.test.ts`

**Interfaces:**
- Produces: `reviews: { quote: string; author: string; source: 'HomeAdvisor' | 'Direct' }[]` exported from `scripts/migrate/reviews-data.ts` — consumed by Task 5's seeding script.

- [ ] **Step 1: Write the failing test**

Create `scripts/migrate/reviews-data.test.ts`:

```ts
import { reviews } from './reviews-data'

describe('reviews data', () => {
  it('has exactly 27 reviews', () => {
    expect(reviews).toHaveLength(27)
  })

  it('has exactly 23 HomeAdvisor-sourced reviews and 4 Direct-sourced reviews', () => {
    const homeAdvisor = reviews.filter((r) => r.source === 'HomeAdvisor')
    const direct = reviews.filter((r) => r.source === 'Direct')
    expect(homeAdvisor).toHaveLength(23)
    expect(direct).toHaveLength(4)
  })

  it('every review has a non-empty quote and author', () => {
    for (const review of reviews) {
      expect(review.quote.length).toBeGreaterThan(0)
      expect(review.author.length).toBeGreaterThan(0)
    }
  })

  it('has no duplicate quotes', () => {
    const quotes = reviews.map((r) => r.quote)
    expect(new Set(quotes).size).toBe(quotes.length)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/migrate/reviews-data.test.ts`
Expected: FAIL — cannot find module `./reviews-data`

- [ ] **Step 3: Write the real data**

Create `scripts/migrate/reviews-data.ts`:

```ts
export interface Review {
  quote: string
  author: string
  source: 'HomeAdvisor' | 'Direct'
}

export const reviews: Review[] = [
  // --- HomeAdvisor (23) ---
  { source: 'HomeAdvisor', author: 'Jane M.', quote: 'Elizabeth and Allie did such a fantastic job painting the interior of my home. They arrived on time everyday (job took 5 days), carefully covered all surfaces, cleaned up daily and respected my home. I would highly recommend The Proper Painter. Thank you again. I will be using your services in the future.' },
  { source: 'HomeAdvisor', author: 'Kim V.', quote: 'Elizabeth and her staff were all excellent to work with! They were very professional, extremely talented and true to their word. Our 28 year old cabinets now look new! I would highly recommend The Proper Painter!' },
  { source: 'HomeAdvisor', author: 'Ray B.', quote: 'Team Proper excellent, meticulous, professional. They go the extra mile. They are cool to work with and easily text or call throughout the process. Definitely hire Liz and TEAM PROPER!' },
  { source: 'HomeAdvisor', author: 'Donna B.', quote: 'Excellent experience! Work was outstanding and Elizabeth was wonderful to work with!' },
  { source: 'HomeAdvisor', author: 'Dan D.', quote: 'Did a great job we are super happy with the painting that was done' },
  { source: 'HomeAdvisor', author: 'Anna L.', quote: "Working with Elizabeth fantastic. We needed 2 rooms painted along with 7 doors. She gave us paint product information and allowed us to make an informed decision. Elizabeth's pricing was fair, her scheduling was accommodating, and her work was just outstanding. Her team was on time and worked so quietly that my husband and I almost forgot they were upstairs painting. We are very happy with her work and her customer service. I would highly recommend!" },
  { source: 'HomeAdvisor', author: 'Shaleea S.', quote: 'Our experience was so wonderful. Expert advice and upfront pricing. The quality of services was just outstanding. Elizabeth and her team made us love our home again. Highly recommend!!' },
  { source: 'HomeAdvisor', author: 'Rich W.', quote: "Very clean, very professional and super easy to work with, fair pricing. She's well educated which was a plus. If I could give her 10 stars I would." },
  { source: 'HomeAdvisor', author: 'Mary G.', quote: 'Elizabeth painted my stair risers and the stair wall. It was covered in wallpaper that was as old as the house. She selected a paint that could cover the paper. She did a fantastic job. She was neat and cleaned everything up before she left. I would definitely hire her again.' },
  { source: 'HomeAdvisor', author: 'MA B.', quote: 'Elizabeth is very professional. When the schedule needed adjusted, communication was clear and reliable. She showed up when she said she would and completed it on time. All tasks were completed as planned and she focused on making sure I was satisfied.' },
  { source: 'HomeAdvisor', author: 'Robyn D.', quote: 'Elizabeth is a good communicator and clearly takes pride in her work. Her finished project is excellent.' },
  { source: 'HomeAdvisor', author: 'Misha G.', quote: 'Elizabeth painted our living room, kitchen, 2.5 baths, 3 bedrooms, and a multi floor foyer. She was easy to communicate with from day one. She checked in with us when our living room paint choice looked too yellow for the room and helped us pick a warm brown that we absolutely love. We will definitely hire her next time we need top-notch painting done.' },
  { source: 'HomeAdvisor', author: 'Michele S.', quote: 'Elizabeth is very professional, friendly and reliable. I am extremely happy with the services she provided. I would not hesitate to refer her to my family and friends. I will definitely use The Proper Painter again!' },
  { source: 'HomeAdvisor', author: 'Tom S.', quote: 'Elizabeth is meticulous in her work. She is always on time & works hard. Her pricing is very fair. I will definitely use Proper Painter again.' },
  { source: 'HomeAdvisor', author: 'Tierney B.', quote: 'Friendly, prompt, clean. Quoting process was clear. Made adjustments to final price based on work needed or not needed. Professional painter who pays attention to detail! Would definitely use again.' },
  { source: 'HomeAdvisor', author: 'Michael A.', quote: 'Great professionalism' },
  { source: 'HomeAdvisor', author: 'Marcie C.', quote: 'Elizabeth was prompt with phone calls and very professional. She explained in detail how the job would be done and she did an outstanding job!' },
  { source: 'HomeAdvisor', author: 'Patricia A.', quote: 'Amazing results. Knowledge, experience. Detailed, exact, science based, meticulous. Care of surroundings, prompt, precise, thorough. Communication, extraordinary personality, one of a kind. My painter forever. Planning next project. Fair pricing. Provides all you need with color help and tools. So happy with results on a room that required lots of details and textures.' },
  { source: 'HomeAdvisor', author: 'JoAnn N.', quote: 'Late season outside paint job, working her schedule around the cold and rain to finish, still a perfectionist! We will definitely want her back in the spring.' },
  { source: 'HomeAdvisor', author: 'Sandi G.', quote: 'Fantastic job' },
  { source: 'HomeAdvisor', author: 'Abigail B.', quote: 'Accurate estimate of time and cost; quality work and attention to detail; appropriate balance of guidance/assistance/information in decision making part of paint choices and details in room' },
  { source: 'HomeAdvisor', author: 'Carol S.', quote: 'Excellent! Capable. Reliable, and competent.' },
  { source: 'HomeAdvisor', author: 'London C.', quote: 'Excellent work. Prompt and professional and efficient. I will definitely hire again and again.' },

  // --- Direct (4, found on the live site's own reviews page, not on HomeAdvisor) ---
  { source: 'Direct', author: 'Denise', quote: "Thank you again for transforming my office into a gorgeous and inspirational space! I am so happy with it! I appreciate all of your and May's hard work, commitment to quality and customer happiness." },
  { source: 'Direct', author: 'Samantha S.', quote: 'Elizabeth & May were extremely professional, organized & so meticulous, especially at the end, making sure everything was perfect! Tons of communication throughout the process and very reliable! They made our cabinets look brand new!' },
  { source: 'Direct', author: 'Mary Pat L.', quote: 'Wow! The proper painter did an AMAZING job with my challenging home from 1903. Worked through all the details! Showed up on time and left the site as clean as when they walked in! So happy and will use them for my next paint/wallpaper job.' },
  { source: 'Direct', author: 'Robyn F.', quote: 'Elizabeth and her crew completed the job at my home within the scheduled time provided. They were thorough in repairing areas of my walls and ceilings that needed it and impeccable in their clean up after the job was completed. I was totally satisfied with their work.' },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scripts/migrate/reviews-data.test.ts`
Expected: PASS (4 cases)

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate/reviews-data.ts scripts/migrate/reviews-data.test.ts
git commit -m "feat: add real testimonial data (27 reviews: 23 HomeAdvisor + 4 direct)"
```

---

### Task 3: Portfolio category inference

**Files:**
- Create: `scripts/migrate/categorize.ts`
- Create: `scripts/migrate/categorize.test.ts`

**Interfaces:**
- Produces: `inferCategory(altText: string): string` from `scripts/migrate/categorize.ts` — consumed by Task 6's portfolio-project document builder to tag each migrated image with a `category` matching one of the site's 5 service names.

- [ ] **Step 1: Write the failing test**

Create `scripts/migrate/categorize.test.ts`:

```ts
import { inferCategory } from './categorize'

describe('inferCategory', () => {
  it('maps kitchen/cabinet alt text to Cabinet Painting', () => {
    expect(inferCategory('Modern white kitchen with cabinets, a gas stove, and decorative plates on display.')).toBe('Cabinet Painting')
  })

  it('maps bathroom/living-room/general room alt text to Interior Painting', () => {
    expect(inferCategory('Modern bathroom with dark walls, white toilet, and matching vanity with a mirror and towel rack.')).toBe('Interior Painting')
    expect(inferCategory('Living room with patterned wallpaper, tufted leather sofa, and glass door to a patio view.')).toBe('Interior Painting')
  })

  it('maps wallpaper-specific alt text to Wallpaper & Faux Finishes', () => {
    expect(inferCategory('Living room with patterned black and white wallpaper wall, leather sofa.')).toBe('Wallpaper & Faux Finishes')
  })

  it('maps staircase/restoration alt text to Restoration', () => {
    expect(inferCategory('Elegant spiral staircase with dark wood treads and white railing, illuminated by a crystal chandelier.')).toBe('Restoration')
  })

  it('falls back to Interior Painting for unrecognized alt text', () => {
    expect(inferCategory('A room in a house.')).toBe('Interior Painting')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/migrate/categorize.test.ts`
Expected: FAIL — cannot find module `./categorize`

- [ ] **Step 3: Implement the function**

Create `scripts/migrate/categorize.ts`:

```ts
const CATEGORY_KEYWORDS: { category: string; keywords: string[] }[] = [
  { category: 'Cabinet Painting', keywords: ['cabinet', 'kitchen'] },
  { category: 'Wallpaper & Faux Finishes', keywords: ['wallpaper'] },
  { category: 'Restoration', keywords: ['staircase', 'restoration', 'antique', 'furniture'] },
  { category: 'Interior Painting', keywords: [] }, // fallback, checked last
]

export function inferCategory(altText: string): string {
  const lower = altText.toLowerCase()
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category
    }
  }
  return 'Interior Painting'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scripts/migrate/categorize.test.ts`
Expected: PASS (5 cases)

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate/categorize.ts scripts/migrate/categorize.test.ts
git commit -m "feat: add portfolio category inference from image alt text"
```

---

### Task 4: Site crawler for real image URLs

**Files:**
- Create: `scripts/migrate/crawl-assets.ts`
- Create: `scripts/migrate/crawled-assets.json` (generated output, committed as a snapshot of what was found)

**Interfaces:**
- Produces: a JSON file at `scripts/migrate/crawled-assets.json` matching `{ url: string; alt: string; sourcePage: string }[]` — consumed by Task 5's upload script.

- [ ] **Step 1: Write the crawler script**

Create `scripts/migrate/crawl-assets.ts`:

```ts
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import path from 'path'

interface CrawledAsset {
  url: string
  alt: string
  sourcePage: string
}

const PAGES_TO_CRAWL = ['/', '/about', '/portfolio', '/team']

async function crawlPage(page: import('playwright').Page, pathname: string): Promise<CrawledAsset[]> {
  await page.goto(`https://www.theproperpainter.com${pathname}`, { waitUntil: 'networkidle' })
  const images = await page.$$eval('img', (imgs) =>
    imgs.map((img) => ({ url: img.src, alt: img.alt }))
  )
  return images
    .filter((img) => img.url && !img.url.startsWith('data:'))
    .map((img) => ({ ...img, sourcePage: pathname }))
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const allAssets: CrawledAsset[] = []

  for (const pathname of PAGES_TO_CRAWL) {
    const assets = await crawlPage(page, pathname)
    allAssets.push(...assets)
    console.log(`Crawled ${pathname}: found ${assets.length} real images`)
  }

  await browser.close()

  const outputPath = path.join(__dirname, 'crawled-assets.json')
  writeFileSync(outputPath, JSON.stringify(allAssets, null, 2))
  console.log(`Wrote ${allAssets.length} total assets to ${outputPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Install Playwright as a script dependency (if not already present)**

```bash
npm install -D playwright
npx playwright install chromium
```

- [ ] **Step 3: Run the crawler for real**

```bash
npx tsx scripts/migrate/crawl-assets.ts
```

(If `tsx` isn't available: `npm install -D tsx` first.)

Expected output: a line per crawled page reporting a nonzero image count, and a final "Wrote N total assets" line. If any page reports 0 images, the site's markup may have changed since this plan was written — stop and report BLOCKED with what you see, rather than guessing.

- [ ] **Step 4: Manually verify the output**

Open `scripts/migrate/crawled-assets.json` and confirm:
- Every entry has a real `url` starting with `https://` (not a `data:` placeholder)
- `alt` text is present and descriptive for most entries (a handful of decorative/icon images with empty alt text is fine and expected)
- No duplicate `url` values with different `alt` text on the same page (would indicate a crawl bug)

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate/crawl-assets.ts scripts/migrate/crawled-assets.json package.json package-lock.json
git commit -m "feat: add Playwright crawler for real site image URLs"
```

---

### Task 5: Asset uploader

**Files:**
- Create: `scripts/migrate/upload-assets.ts`
- Create: `scripts/migrate/upload-assets.test.ts`

**Interfaces:**
- Consumes: `sanityWriteClient` (Task 1), the `CrawledAsset[]` shape from `scripts/migrate/crawled-assets.json` (Task 4)
- Produces: `uploadAsset(client: SanityClient, asset: { url: string; alt: string }): Promise<{ _type: 'image'; asset: { _type: 'reference'; _ref: string } }>` from `scripts/migrate/upload-assets.ts` — consumed by Task 6's document-creation script. The return shape is a standard Sanity image field value.

- [ ] **Step 1: Write the failing test**

Create `scripts/migrate/upload-assets.test.ts`:

```ts
import { uploadAsset } from './upload-assets'

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
})

describe('uploadAsset', () => {
  it('downloads the image and uploads it to Sanity, returning an image field value', async () => {
    const mockClient = {
      assets: {
        upload: jest.fn().mockResolvedValue({ _id: 'image-abc123-800x600-jpg' }),
      },
    } as any

    const result = await uploadAsset(mockClient, { url: 'https://example.com/photo.jpg', alt: 'A kitchen' })

    expect(fetch).toHaveBeenCalledWith('https://example.com/photo.jpg')
    expect(mockClient.assets.upload).toHaveBeenCalledWith('image', expect.any(Buffer), {
      filename: 'photo.jpg',
    })
    expect(result).toEqual({
      _type: 'image',
      asset: { _type: 'reference', _ref: 'image-abc123-800x600-jpg' },
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/migrate/upload-assets.test.ts`
Expected: FAIL — cannot find module `./upload-assets`

- [ ] **Step 3: Implement the uploader**

Create `scripts/migrate/upload-assets.ts`:

```ts
import type { SanityClient } from '@sanity/client'

export interface ImageFieldValue {
  _type: 'image'
  asset: { _type: 'reference'; _ref: string }
}

export async function uploadAsset(
  client: SanityClient,
  asset: { url: string; alt: string }
): Promise<ImageFieldValue> {
  const response = await fetch(asset.url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const filename = asset.url.split('/').pop() || 'image.jpg'

  const uploaded = await client.assets.upload('image', buffer, { filename })

  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: uploaded._id },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scripts/migrate/upload-assets.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate/upload-assets.ts scripts/migrate/upload-assets.test.ts
git commit -m "feat: add Sanity image asset uploader"
```

---

### Task 6: Add siteSettings logo field, then seed testimonials, siteSettings, and teamMember

**Files:**
- Modify: `src/sanity/schemaTypes/siteSettings.ts`
- Modify: `src/sanity/schemaTypes/schema.test.ts`
- Create: `scripts/migrate/seed-core-content.ts`
- Create: `scripts/migrate/seed-core-content.test.ts`

**Interfaces:**
- Consumes: `sanityWriteClient` (Task 1), `reviews` (Task 2), `uploadAsset` (Task 5), `scripts/migrate/crawled-assets.json` (Task 4)
- Produces: a `seedTestimonials`, `seedSiteSettings`, `seedTeamMember` set of functions from `scripts/migrate/seed-core-content.ts` that build correct Sanity document objects — these are the pure, testable parts; the actual `client.create()` calls are verified by a real run, not mocked assertions on network behavior.

- [ ] **Step 0a: Write the failing schema test for the new `logo` field**

In `src/sanity/schemaTypes/schema.test.ts`, add to the existing `siteSettings` test:

```ts
it('siteSettings has contactEmail, contactPhone, socialLinks, logo', () => {
  const settings = schemaTypes.find((s) => s.name === 'siteSettings')!
  expect(fieldNames(settings)).toEqual(
    expect.arrayContaining(['contactEmail', 'contactPhone', 'socialLinks', 'logo'])
  )
})
```

(Replace the existing `siteSettings` test case, which currently omits `logo`, with this one.)

- [ ] **Step 0b: Run test to verify it fails**

Run: `npm test -- src/sanity/schemaTypes/schema.test.ts`
Expected: FAIL — `logo` not found in siteSettings fields

- [ ] **Step 0c: Add the field**

In `src/sanity/schemaTypes/siteSettings.ts`, add to the `fields` array:

```ts
defineField({ name: 'logo', title: 'Logo', type: 'image', options: { hotspot: true } }),
```

- [ ] **Step 0d: Run test to verify it passes**

Run: `npm test -- src/sanity/schemaTypes/schema.test.ts`
Expected: PASS

- [ ] **Step 0e: Commit the schema change on its own**

```bash
git add src/sanity/schemaTypes/siteSettings.ts src/sanity/schemaTypes/schema.test.ts
git commit -m "feat: add logo field to siteSettings schema"
```

- [ ] **Step 1: Write the failing tests**

Create `scripts/migrate/seed-core-content.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/migrate/seed-core-content.test.ts`
Expected: FAIL — cannot find module `./seed-core-content`

- [ ] **Step 3: Implement the document builders and seed runner**

Create `scripts/migrate/seed-core-content.ts`:

```ts
import { readFileSync } from 'fs'
import path from 'path'
import { sanityWriteClient } from './sanity-write-client'
import { uploadAsset, type ImageFieldValue } from './upload-assets'
import { reviews, type Review } from './reviews-data'

interface CrawledAsset {
  url: string
  alt: string
  sourcePage: string
}

export function buildTestimonialDocs(reviewList: Review[]) {
  return reviewList.map((review) => ({
    _type: 'testimonial' as const,
    quote: review.quote,
    author: review.author,
    source: review.source,
  }))
}

export function buildSiteSettingsDoc(logo: ImageFieldValue) {
  return {
    _type: 'siteSettings' as const,
    _id: 'siteSettings',
    contactPhone: '412-427-6873',
    contactEmail: 'theproperpainterllc@gmail.com',
    logo,
    socialLinks: [
      { platform: 'HomeAdvisor', url: 'https://www.homeadvisor.com/rated.TheProperPainterLLC.118848373.html' },
      { platform: 'Facebook', url: 'https://facebook.com/theproperpainterllc' },
      { platform: 'Instagram', url: 'https://instagram.com/theproperpainterllc' },
      { platform: 'Google Reviews', url: 'https://g.page/r/CQ7RtRHDEUczEAE/review' },
    ],
  }
}

export function buildTeamMemberDoc() {
  return {
    _type: 'teamMember' as const,
    name: 'Elizabeth Best',
    role: 'Owner, M. Arch',
    bio: "I am passionate about creating amazing spaces! I have always worked with my hands and consider myself a craftswoman to the core. It all started when I was young, building dollhouses. Those dollhouses got me a scholarship to the Savannah College of Art & Design, School of Building Arts. After 5 years of intensive study, I graduated with both a Master's and Bachelor's Degrees in Architecture. My creative energy leads the way. I'm an enthusiastic entrepreneur who is not afraid of reinvention. I'm proud to say that I am a Mother, Professional Painter, Craftswoman, Designer, Employer, US Patent Holder, and much more! Moving into the future, I want my business model to center around fostering and inspiring other women to enter the trades.",
  }
}

async function findAndUploadLogo(): Promise<ImageFieldValue> {
  const manifestPath = path.join(__dirname, 'crawled-assets.json')
  const assets: CrawledAsset[] = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  const logoAsset = assets.find((a) => a.alt === 'The Proper Painter, LLC')
  if (!logoAsset) {
    throw new Error(
      'Could not find the logo image (alt="The Proper Painter, LLC") in crawled-assets.json. Re-run Task 4\'s crawler, or check whether the live site changed its logo alt text.'
    )
  }
  return uploadAsset(sanityWriteClient, logoAsset)
}

async function main() {
  const testimonialDocs = buildTestimonialDocs(reviews)
  for (const doc of testimonialDocs) {
    await sanityWriteClient.create(doc)
  }
  console.log(`Created ${testimonialDocs.length} testimonial documents`)

  const logo = await findAndUploadLogo()
  await sanityWriteClient.createOrReplace(buildSiteSettingsDoc(logo))
  console.log('Created/updated siteSettings document (including real logo)')

  await sanityWriteClient.create(buildTeamMemberDoc())
  console.log('Created teamMember document for Elizabeth')
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scripts/migrate/seed-core-content.test.ts`
Expected: PASS (3 cases)

- [ ] **Step 5: Run the real seed against Sanity**

```bash
npx tsx scripts/migrate/seed-core-content.ts
```

Expected: console output confirming 27 testimonials created, siteSettings created/updated, and the team member document created, with no errors.

- [ ] **Step 6: Manually verify in Studio**

```bash
npm run dev
```

Visit `http://localhost:3000/studio`, open the Testimonial list, and confirm 27 real entries exist (not placeholder text). Open Site Settings and confirm the phone, email, 4 social links, and the real logo image (the circular badge with the paintbrush) all appear correctly. Open Team Member and confirm Elizabeth's real bio appears.

- [ ] **Step 7: Commit**

```bash
git add scripts/migrate/seed-core-content.ts scripts/migrate/seed-core-content.test.ts
git commit -m "feat: seed real testimonials, site settings, and team member into Sanity"
```

---

### Task 7: Seed portfolio projects and service images

**Files:**
- Create: `scripts/migrate/seed-portfolio-and-services.ts`

**Interfaces:**
- Consumes: `sanityWriteClient` (Task 1), `uploadAsset` (Task 5), `inferCategory` (Task 3), `scripts/migrate/crawled-assets.json` (Task 4)
- Produces: `portfolioProject` documents, and `service` documents (create-or-update by `slug`) with `heroImage` set. **Note:** the Site Foundation plan's Task 8 only registered the `service` *schema type* in Sanity Studio — it never created any actual `service` *documents*. This task is the first thing to create real `service` content, so it must create-or-update by slug, not assume the documents already exist.

- [ ] **Step 1: Write the script**

Create `scripts/migrate/seed-portfolio-and-services.ts`:

```ts
import { readFileSync } from 'fs'
import path from 'path'
import { sanityWriteClient } from './sanity-write-client'
import { uploadAsset, type ImageFieldValue } from './upload-assets'
import { inferCategory } from './categorize'

interface CrawledAsset {
  url: string
  alt: string
  sourcePage: string
}

const SERVICES: { category: string; slug: string; title: string }[] = [
  { category: 'Interior Painting', slug: 'interior-painting', title: 'Interior Painting' },
  { category: 'Cabinet Painting', slug: 'cabinetpainting', title: 'Cabinet Painting' },
  { category: 'Restoration', slug: 'minor-restoration', title: 'Restoration' },
  { category: 'Wallpaper & Faux Finishes', slug: 'wallpaper', title: 'Wallpaper & Faux Finishes' },
]

async function upsertServiceHeroImage(category: string, image: ImageFieldValue) {
  const serviceMeta = SERVICES.find((s) => s.category === category)
  if (!serviceMeta) return // e.g. "Color Consultation" has no photo category mapping in this pass

  const existing = await sanityWriteClient.fetch<{ _id: string; heroImage?: unknown } | null>(
    `*[_type == "service" && slug.current == $slug][0]{_id, heroImage}`,
    { slug: serviceMeta.slug }
  )

  if (existing) {
    if (!existing.heroImage) {
      await sanityWriteClient.patch(existing._id).set({ heroImage: image }).commit()
    }
    return
  }

  // Service document doesn't exist yet (Site Foundation only registered the schema
  // type, not any content) — create it now with the real title/slug/heroImage.
  await sanityWriteClient.create({
    _type: 'service',
    title: serviceMeta.title,
    slug: { _type: 'slug', current: serviceMeta.slug },
    heroImage: image,
  })
}

async function main() {
  const manifestPath = path.join(__dirname, 'crawled-assets.json')
  const assets: CrawledAsset[] = JSON.parse(readFileSync(manifestPath, 'utf-8'))

  // Only migrate real photography (has meaningful alt text, not icons/logos).
  const photoAssets = assets.filter((a) => a.alt && a.alt.length > 15)

  let projectCount = 0
  for (const asset of photoAssets) {
    const category = inferCategory(asset.alt)
    const image = await uploadAsset(sanityWriteClient, asset)

    await sanityWriteClient.create({
      _type: 'portfolioProject',
      title: asset.alt,
      category,
      afterImage: image,
      description: asset.alt,
    })
    projectCount++

    await upsertServiceHeroImage(category, image)
  }

  console.log(`Created ${projectCount} portfolio project documents and created/updated matching service documents`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Run the real script against Sanity**

```bash
npx tsx scripts/migrate/seed-portfolio-and-services.ts
```

Expected: console output reporting a nonzero count of created portfolio project documents, no errors. If it reports 0, check `scripts/migrate/crawled-assets.json` from Task 4 has entries with alt text longer than 15 characters — if not, lower the threshold in Step 1 and re-run.

- [ ] **Step 3: Manually verify in Studio**

Visit `http://localhost:3000/studio`, open the Portfolio Project list, and confirm real entries exist with real images and reasonable categories (spot-check 3-4 entries — a kitchen photo should be tagged "Cabinet Painting", a wallpaper photo "Wallpaper & Faux Finishes", etc.). Open at least 2 of the 5 relevant Service documents and confirm a hero image is set.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate/seed-portfolio-and-services.ts
git commit -m "feat: seed portfolio projects and service hero images from crawled photos"
```

---

## What this plan does NOT cover

- Any Next.js page/template changes to actually display this content (next plan: page-by-page design build)
- Before/after photo pairs (only `afterImage` populated)
- A full team-bios section beyond Elizabeth
- DripJobs/Zapier lead-capture integration
- Launch QA / DNS cutover
