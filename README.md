# The Proper Painter — Website

Marketing site for The Proper Painter, a women-owned painting company. Built with
[Next.js](https://nextjs.org) (App Router) and [Sanity](https://www.sanity.io) as a headless CMS.

This project was built as the "Site Foundation" phase per:

- Design spec: [`docs/superpowers/specs/2026-09-04-new-site-design.md`](docs/superpowers/specs/2026-09-04-new-site-design.md)
- Implementation plan: [`docs/superpowers/plans/2026-09-04-site-foundation.md`](docs/superpowers/plans/2026-09-04-site-foundation.md)

## Running locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root with your Sanity project's identifiers:

   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=<your-sanity-project-id>
   NEXT_PUBLIC_SANITY_DATASET=<your-sanity-dataset>
   ```

   Get the real values from whoever manages the Sanity project.

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

Other useful commands:

```bash
npm run build   # production build
npm run lint    # eslint
npm test        # jest unit tests + e2e/staging smoke test (skipped without STAGING_URL)
```

The Sanity Studio is available at `/studio` when the app is running (requires a Sanity
account with access to the project).

## Deployment

The site is deployed on Vercel, project `site-foundation` under the `proper-painter` team
scope. Deployment Protection (Vercel Authentication) is disabled, so preview URLs are
publicly viewable without a Vercel login.

Current staging preview (updated 2026-09-04, reflects the merged `master` at the time):
<https://site-foundation-robt2ammh-proper-painter.vercel.app>

This URL changes on every `vercel` deploy — to find the current one, run `vercel ls` from
the project directory (needs `vercel link` run once per local clone; see note below) or
check the Vercel dashboard. To deploy a fresh preview after pulling new changes:

```bash
npx vercel --yes
```

**Note on `vercel link`:** the CLI's project link (`.vercel/project.json`) is local to
whichever directory you run it from — it is not committed (`.vercel` is gitignored) and
does not carry over between a git worktree and the main checkout. If `vercel` commands
report they can't find a linked project, run `npx vercel link --yes --project site-foundation`
first.

## Known follow-ups / handoff items

- **Orphaned Vercel project:** There was an empty, harmless duplicate project — also named
  `site-foundation` — under a different, personal Vercel account from an earlier setup
  mixup. Delete it via that account's dashboard whenever convenient; it holds no traffic or
  config.
- **Preview environment env vars:** `NEXT_PUBLIC_SANITY_PROJECT_ID` and
  `NEXT_PUBLIC_SANITY_DATASET` are currently only configured for the Production environment
  in Vercel. Vercel requires a connected Git repository to scope environment variables to
  Preview deployments per-branch, and this repo doesn't have one yet (it's local-only, no
  GitHub remote). Once a Git remote is connected, add these same two variables scoped to
  Preview as well.
- **Sanity Studio visual check:** Someone with real Sanity credentials still needs to log
  into `/studio` on a running instance and visually confirm all 5 document types (Service,
  Portfolio Project, Testimonial, Team Member, Site Settings) appear correctly in the
  sidebar with working "create new" forms. This couldn't be verified by an automated agent
  since Sanity Studio requires interactive account login.
- **Out of scope for this phase:** This "Site Foundation" plan intentionally does not
  include real content or photos, page-specific visual design, DripJobs CRM integration, or
  customer review data. See the design spec above for what's planned next.
