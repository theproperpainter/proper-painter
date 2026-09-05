# Content & Asset Migration Scripts

## These scripts already ran, for real, against production

The scripts in this directory were run once, for real, against the **production**
Sanity project `nqr6djox` on **2026-09-04/2026-09-05**. They wrote:

- 27 `testimonial` documents (23 sourced from HomeAdvisor, 4 from Direct)
- 1 `siteSettings` document (logo, contact info, social links)
- 1 `teamMember` document
- 5 `portfolioProject` documents
- 4 `service` documents (with hero images)

This was a real, one-time content migration from the live site into production Sanity —
not a dry run, not a staging dataset.

## They are NOT idempotent — do not re-run without adding checks first

`seed-core-content.ts` and `seed-portfolio-and-services.ts` both call `client.create()`
with **no existing-document check**. Re-running either script will create **duplicate**
testimonial, team-member, and/or portfolio-project documents in production.

**Do not re-run any script in this directory** without first adding idempotency checks
(e.g., querying for an existing document by a stable key — such as `author` + `quote`
for testimonials, or `title`/`category` for portfolio projects — before calling
`client.create()`).

## How to run these scripts from a fresh clone

`scripts/migrate/sanity-write-client.ts` reads `process.env.SANITY_API_TOKEN`, but
nothing in this directory loads `.env.local` automatically when running via `npx tsx`.
You must load it explicitly using Node's built-in `--env-file` flag (available in the
Node version this project uses — no `dotenv` dependency needed):

```bash
npx tsx --env-file=.env.local scripts/migrate/<script-name>.ts
```

For example:

```bash
npx tsx --env-file=.env.local scripts/migrate/seed-core-content.ts
```

Without `--env-file=.env.local`, `SANITY_API_TOKEN` (and the `NEXT_PUBLIC_SANITY_*`
vars) will be undefined and the script will fail to authenticate.

## Known follow-ups

1. **Sanity Studio CORS gap.** `/studio` at `localhost:3000` is not currently a
   registered CORS origin for project `nqr6djox`. Whoever has real sanity.io login
   access for this project needs to either add it via the sanity.io dashboard
   (Project → API → CORS Origins) or run `npx sanity cors add http://localhost:3000`
   while authenticated. Once that's fixed, someone should do a real **visual** check
   in Studio of the 27 testimonials, the `siteSettings` document (logo, contact info,
   social links), and the portfolio projects/services created by this migration — this
   content has only ever been verified via direct API queries, never visually
   confirmed in Studio.

2. **2 real photos were not migrated.** Two `/portfolio` page images (inner asset IDs
   ending `...36qkUdMJygZvtzxbLkh5z6DZHNwsdpa8Cm7z9q6YX4e6iPg7MXLwr9VjmgYH8QQM.jpg` and
   `...1044yBUJaHVeBfUkCz6livc6eWPeToliBfO5YGgNeGBYuAfZL6SpZQqFOQU2bpm7.png`) had no alt
   text anywhere in the crawl, so they were excluded by the `alt.length > 15` filter in
   `seed-portfolio-and-services.ts`. If these photos are still wanted, they need to be
   manually added to Sanity via Studio, with hand-written titles/descriptions.

3. **Image quality/provenance.** Portfolio and service images were migrated via the
   live site's Next.js `_next/image?url=...&w=1920&q=90` proxy URLs rather than the
   original CDN files — meaning the images now in Sanity are 1920px-wide, quality-90
   JPEGs (Next's re-encoded output), not pristine originals. This is an intentional,
   reasonable web-quality tradeoff, not a bug, but worth knowing if someone wonders why
   images aren't at their absolute original resolution.
