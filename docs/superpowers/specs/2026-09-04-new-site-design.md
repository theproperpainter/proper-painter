# The Proper Painter — New Website Design

## Background

Elizabeth Best (Owner, "Boss Lady") runs The Proper Painter, a women-owned
and operated interior painting company, currently live at
theproperpainter.com. The goal is a full rebuild: a clean, modern,
photography-forward site that leads with the women-owned/women-run story,
replaces the current builder-based site with a custom-coded one, pulls
forward existing content/images and Angie's List reviews, and wires new
leads directly into her DripJobs CRM.

## Current site inventory

- Tagline: "Transforming Spaces, One Room at a Time"
- Badge copy already in place: "WOMEN-OWNED & OPERATED | FULLY INSURED
  LICENSED CONTRACTOR"
- Owner bio (`/about`): Elizabeth Best, M. Arch — SCAD School of Building
  Arts (B.Arch + M.Arch), US patent holder, mother, explicit mission to
  bring more women into the trades. Strong "why" content to build the
  About page and homepage narrative around.
- Services: Interior Painting, Kitchen Cabinet Painting, Restoration,
  Wallpaper & Faux Finishes, Color Consultation & Design, Furniture
- On-site testimonials (Denise, Donna, Raymond B., Mary Pat L., Misha,
  Kim V., Samantha S.) — appear Angie's List-sourced already, plus a
  `/team` page with more.
- Photos are lazy-loaded behind JS placeholders (base64 GIF stand-ins) —
  a plain HTML fetch cannot retrieve the real image files; requires a
  headless-browser crawl.
- Existing URL structure (to be preserved for SEO):
  `/`, `/about`, `/portfolio`, `/team`, `/contact`,
  `/services`, `/services/interior-painting`, `/services/cabinetpainting`,
  `/services/minor-restoration`, `/services/wallpaper`,
  `/services/colorconsult`

## Decisions

| Area | Decision |
|---|---|
| Frontend framework | Next.js (App Router), deployed on Vercel |
| CMS | Sanity (headless) — Elizabeth edits services, portfolio photos, testimonials, and team bios herself; Sanity's image pipeline auto-generates optimized/responsive images |
| Styling foundation | Tailwind CSS + shadcn/ui primitives (unstyled behavior only, fully re-skinned — not shadcn's default look) |
| Visual direction | Pure black-and-white / grayscale, no accent color. High-contrast, gallery-style, photography-led layout. |
| Design process | `frontend-design` skill for art direction (avoiding generic/templated AI aesthetics) + `ui-ux-pro-max` skill for systematic design-system decisions (type pairing, spacing, palette structure) + 21st.dev component registry (`21st-registry`, `21st-ui-explore`, `21st-ui-build`, `21st-ui-review`) for higher-polish component implementations and a pre-launch UI review pass |
| Site map | Mirror the current URL structure 1:1 for SEO continuity — no new blog for v1 |
| Content model | Sanity schemas: `Service`, `PortfolioProject` (before/after images, category), `Testimonial` (quote, author, source tag), `TeamMember`, `SiteSettings` (contact info, socials) |
| Asset migration | Playwright headless-browser crawl of the live site to capture real photo files (bypassing lazy-load placeholders), then re-upload into Sanity's image pipeline |
| Reviews | Elizabeth exports/screenshots reviews from her Angie's List seller dashboard; reviews are transcribed into the `Testimonial` schema with real attribution (name, source tag) — no live/fake "pulled from Angie's List" widget |
| Lead capture / CRM | Quote form on `/contact` posts to a Next.js API route, which calls a Zapier webhook that creates a new lead in Elizabeth's DripJobs pipeline (requires DripJobs Advanced plan, which includes Zapier) — this triggers her existing automated drip follow-up sequences |
| Scheduling | No separate booking/calendar widget — the quote form is the only lead-capture mechanism for v1 |
| Photography | Existing photo library is treated as sufficient to start; real files pulled during asset migration rather than commissioning a new shoot |
| Launch | Build and review on a Vercel preview/staging URL; current live site (theproperpainter.com) stays untouched until Elizabeth approves, then DNS is cut over |
| Repo | New dedicated git repo at `C:\Users\El_Gu\Projects\ProperPainter` (separate from the home-rooted repo that was incorrectly tracking other projects) |

## Out of scope (v1)

- Blog / ongoing SEO content section
- On-site scheduling/booking widget
- New professional photography shoot
- Embedding a live DripJobs widget (no such widget exists — DripJobs is
  backend-only; integration is via Zapier webhook, not an embed)
- Automated/live pulling of Angie's List reviews (no public API for this;
  manual export/transcription only)

## QA before launch

- Verify every existing URL still resolves under the new site (no broken
  inbound links / lost SEO equity)
- Lighthouse pass for performance and accessibility
- End-to-end test: submit a real lead through the new quote form and
  confirm it lands correctly in Elizabeth's live DripJobs pipeline
  before going live
