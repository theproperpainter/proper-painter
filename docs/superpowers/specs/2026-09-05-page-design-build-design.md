# Page-by-Page Design Build — Design

## Background

The "Site Foundation" plan built a working skeleton (Next.js, grayscale theme, Sanity CMS,
placeholder pages). The "Content & Asset Migration" plan populated that CMS with real
content: 27 testimonials, real site settings (logo, phone, email, social links), a team
member profile for Elizabeth, and 4 real portfolio projects + 4 service documents with hero
images.

This plan is the first real visual design pass: every page currently renders as a bare
`<h1>` on a black background. This plan builds actual layouts against the real content,
using the `frontend-design` and `ui-ux-pro-max` skills for art direction and design-system
decisions, and the `21st.dev` component registry for specific interactive patterns (e.g. a
photo lightbox) rather than assembling pages from library components — the goal is a
distinctive, intentional design, not a generic template feel.

## Decisions

| Area | Decision |
|---|---|
| Approach | Bespoke, art-directed build (`frontend-design` + `ui-ux-pro-max` for layout/typography/systematic design decisions), `21st.dev` registry used only for specific interactive components, not page assembly |
| Typography | A display serif for headlines (e.g. Playfair Display, echoing Elizabeth's architecture background) paired with a clean humanist sans for body text (e.g. Inter), loaded via `next/font/google` |
| Color | No new palette — the existing grayscale tokens (`background`/`foreground`/`gray-50..950`) applied with intentional hierarchy, not flat black-on-white everywhere |
| Site map change | Adds one new route, `/our-team`, for Elizabeth's professional profile. `/team` (existing URL, preserved for SEO) stays the reviews page — it no longer also carries a profile card |
| `/about` vs `/our-team` | `/about` = company story & mission (women-owned, inspiring women into trades). `/our-team` = Elizabeth's straightforward professional bio/profile. Distinct purposes, not merged |
| Shared components | `Header` (real logo + nav + mobile hamburger menu — no responsive treatment exists yet), `Footer` (logo, real social links, contact info), `ServiceCard`, `PortfolioCard`, `TestimonialCard`, and shared `Section`/`Container` layout primitives for consistent spacing/rhythm across pages |
| Data layer | Pages fetch content via the existing `sanityFetch` helper (`src/lib/sanity/client.ts`) with GROQ queries. Images render through Sanity's image URL builder (new dependency: `@sanity/image-url`) piped into `next/image` |
| Home | Hero (real photo + headline + women-owned messaging + CTA), services preview grid, a short "meet Elizabeth" teaser linking to `/our-team`, 3-4 featured testimonials, closing CTA |
| About | Company story & mission content only |
| Our Team (new) | Elizabeth's profile: role, background (SCAD, M.Arch, patent holder). No headshot photo exists yet — graceful text-only layout, not a broken image slot |
| Services index | Grid linking to all 5 service pages. 4 have real hero photos; Color Consultation doesn't yet, so it gets a clean text-only card, not a broken image |
| 5 service sub-pages | Hero image + description + any matching portfolio photos (by category) + CTA |
| Portfolio | Gallery of the 4 real projects, designed to look intentional at this size and grow later — not like a page waiting for more content |
| Team/Reviews (`/team`) | All 27 testimonials in a clean grid — full list, no pagination or curation (a 5-star-reviewed business's full review volume is a real asset) |
| Contact | Phone/email from site settings + a well-designed form, visual only — not wired to any backend yet |
| Responsiveness | A working, real mobile layout is in scope (this is a real production site) — mobile-specific interaction polish beyond that is not |

## Out of scope

- DripJobs form wiring (a later plan)
- A real headshot photo for Elizabeth (add later when available)
- Mobile-specific interaction polish beyond a working responsive layout
- Any new photography beyond what's already in Sanity

## QA before considering this plan done

- Every one of the 12 routes (11 existing + `/our-team`) renders real content with the new
  design, not placeholder `<h1>` text
- Site is usable and looks intentional at mobile widths, not just desktop
- No broken image slots for content that doesn't exist yet (Color Consultation's hero,
  Elizabeth's headshot) — these get deliberate text-only treatments, not missing-image icons
- Header nav includes the new `/our-team` link
