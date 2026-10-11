# Internal Cash & Project Calendar — Plan

Replaces the attempt to build an all-in-one calendar inside the `Schedule Calendar`
Google Sheet tab (jobs + cash balance + bills-due stacked into formula cells). That
approach kept breaking — see the long history in `docs/Financial Workbook/` scripts
and setup docs. Decision (2026-10-10): keep the existing Sheets/Zapier/Plaid/SW
pipelines as the **data layer** (they mostly work and shouldn't be touched), but
build the **combined view** as a small internal page on the existing Next.js site
instead of continuing to force it into spreadsheet cells.

## Why

Elizabeth's #1 problem: knowing **how much money is actually available right now**,
since that number gates whether a new project gets started. Everything below exists
to answer that one question well, with a calendar as supporting context.

## The headline number: Available Cash

```
Available Cash (as of a date)
  = today's live FNB balance (from Plaid, already synced into Transactions Log)
  − every KNOWN scheduled outflow between today and that date
```

"Known scheduled outflow" = the Recurring Bills list + Sherwin-Williams' real due
amounts + Payroll. **Never includes projected incoming job payments** — deposits are
unpredictable on purpose, and the forecast should only ever reflect what's actually
known, not what might come in.

This is the same calculation anchored at two different points:
- **Today** → the headline "Available Cash" figure, shown large, first thing on the page.
- **Any future date the user navigates to** → the same formula, clearly labeled as a
  *projection*, not a guarantee.

For **past months**: jobs and SW bills show real history (both are already logged
over time). Cash balance history only exists from whenever the new daily balance log
(below) starts recording — nothing can be backfilled before that.

## Explicitly OUT of scope for this build

- **Material / subcontractor costs.** Unpredictable in advance, so never part of the
  projection. Showing them as calendar line items when they *do* occur was discussed,
  but the only candidate data sources are unresolved right now:
  - `Expense Tracker` (manual entry) may be deprecated.
  - Auto-populating from FNB transactions is explicitly **not** happening — FNB
    transaction pulling was tried before and turned off because it caused too much
    confusion; only the balance stays on.
  - Sherwin-Williams purchases ARE captured (via the existing SW sync) and could
    feed this later, but building that display is deferred.
  - **Revisit this "down the road."** Don't build it now.
- Reviving FNB Plaid transaction-level pulling. Off on purpose; stays off.
- Any editing capability — this page is read-only.

## Data sources (all read-only)

| Source | What it provides | Status |
|---|---|---|
| `Schedule Input` tab | Jobs: name, dates, status, crew. Hide "Complete" (same rule as `autoAssignCalSlots`). | Already populated |
| `Transactions Log` rows 3–4 | Today's live FNB balance (Plaid, daily sync) | Already populated |
| **NEW:** daily balance log | Same balance, but *appended* each day instead of overwritten, so past months become meaningful over time | **Proposed, not yet built** — small addition to the existing Plaid Apps Script |
| `SW Credit Account` tab | Real Sherwin-Williams charges/payments. **Confirmed (2026-10-11): columns are `Date \| Description \| Job/PO \| Amount \| Receipt # \| Notes` — no due-date field anywhere, not in the live tab nor the raw SW portal exports.** SW terms are **Net 30** (confirmed by user) — due date = invoice date + 30 days, computed by this app, not stored in the sheet. Which invoices are still open isn't explicit either (payments aren't linked to a specific invoice) — resolved by applying payments to the oldest open charges first (FIFO) and treating any remaining unpaid amount per charge as due 30 days after that charge's date. | Exists (daily sync); due-date computation is new app logic, not a sheet change |
| **NEW:** Recurring Bills list | Manually-entered known autopay items (car payment, etc.): name, amount, day of month | **Not yet built** — small new tab, user-maintained, no automated detection |
| `Payroll` tab | Recurring payroll outflow | Included in the known-expenditures forecast |

## Calendar view

- Custom-built month grid in Tailwind (not a calendar library — this is read-only
  display, no drag/drop, and a hand-built grid matches the site's existing minimal
  look better than a generic library's default styling).
- Prev/Next month navigation.
- Each job shows on its date range; a deposit-received indicator (DripJobs Amount
  Paid > 0 via the `Invoices` tab, matched on Project ID) shows when known — carried
  over from the earlier Sheets-calendar idea, but as a proper badge/icon in the real
  UI rather than a second line of cell text (that was a spreadsheet-specific
  workaround, not needed here).
- SW bill due dates show as their own entries.
- Material/sub costs: not shown (see Out of Scope).

## Access

- New route, e.g. `/dashboard`, gated by Next.js middleware — not linked from the
  public site, excluded from the sitemap, `Disallow`'d in `robots.ts`.
- **Confirmed (2026-10-10):** a single shared password (env var), checked
  server-side, httpOnly session cookie. Simpler than per-user accounts for an
  audience of two (the user + Elizabeth). Revisit named logins (Auth.js) only if
  individual access/revocation ever matters later.

## Still open before implementation starts

1. ~~Confirm the shared-password approach~~ — **confirmed 2026-10-10**, see Access above.
2. ~~Confirm/add the daily balance log~~ — **confirmed and built 2026-10-11**. Added
   `_appendBalanceHistory` to `ProperPainter_PlaidSync-1.gs`, called from
   `_updateAccountBalances`. Logs one row per account per calendar date to a new
   `Balance History` tab (created automatically on first run); re-running the same
   day updates that day's row instead of duplicating; a missing/N-A balance is
   skipped rather than logged as a fake number. Tested locally (fresh sheet, same-day
   rerun, next-day append, missing-balance skip, Date-object dedup) — **not yet
   pasted into the live Apps Script, not yet committed.**
3. ~~See the SW data~~ — **resolved 2026-10-11**, see the data-source table above
   (Net 30, FIFO-allocated due dates computed by the app).
4. ~~Google Cloud access~~ — **resolved 2026-10-11.** Service-account key creation is
   blocked org-wide (see memory: `project-google-cloud-org-policy`). Reused the
   existing OAuth credential from `sw_sync.py` instead
   (`docs/Financial Workbook/PlaidSync/oauth_client_secret.json` +`token.json`).
   The cached token had died (`invalid_grant`) — fixed by
   `docs/Financial Workbook/PlaidSync/refresh_google_token.py` (new, redoes just the
   browser sign-in step). **This likely means the daily SW sync via GitHub Actions
   had also been silently failing** — the user needs to check the Actions tab and,
   if so, update the `GOOGLE_TOKEN_JSON` secret with the new `token.json` contents.
   `src/lib/google-sheets/client.ts` (new) does the actual reads; `googleapis` added
   as a dependency; four new env vars in `.env.local`
   (`GOOGLE_SHEETS_CLIENT_ID/_SECRET/_REFRESH_TOKEN/_SPREADSHEET_ID`). Verified
   end-to-end against the live `Schedule Input` tab.

All four blockers are now resolved. Next: build the dashboard itself (middleware
password gate, the page, the calculations above).

## Build progress

**Auth layer: built and verified end-to-end (2026-10-11).** Note: Next.js 16
renamed `middleware.ts` to `proxy.ts` (same concept, new file/export name) —
confirmed via the bundled docs, not assumed from training data (see `AGENTS.md`).

- `src/proxy.ts` — gates `/dashboard/:path*`, redirects to `/dashboard/login` if
  the session cookie is missing/invalid. Login page itself is excluded.
- `src/lib/dashboard/session-token.ts` — shared JWT verify logic (no `next/headers`
  dependency, so it works both in Proxy's request-based cookie API and in Server
  Components' `cookies()` API without duplicating the verification logic).
- `src/lib/dashboard/session.ts` — `verifyPassword` (constant-time compare),
  `createSession`/`deleteSession` (30-day JWT cookie via `jose`, following the
  Next.js auth guide's recommended pattern directly).
- `src/app/dashboard/login/` — login page (`useActionState` + a Server Action) and
  `src/app/dashboard/page.tsx` — placeholder page + logout button.
- `src/app/robots.ts` — `/dashboard` added to disallow, alongside the existing `/studio`.
- Verified with a real Playwright browser run, not just read-through: unauthenticated
  redirect, wrong-password rejection, successful login reaching `/dashboard`, logout
  clearing the session, and the gate re-engaging after logout. All passed.

**Known cosmetic tradeoff, not fixed:** the public `Header`/`Footer` render around
every page from the root layout, so `/dashboard` currently sits inside the normal
site chrome rather than feeling like a separate internal app. A clean fix exists
(Next.js route groups with a second root layout) but means restructuring most of
`app/` — out of scope unless it actually bothers the user in practice.

**Live in production (2026-10-12).** Real password set (`amber-velvet-cedar-59` —
shared with Elizabeth, not a secret worth rotating urgently but change it if it
leaks). All 6 env vars added to Vercel (Production + Preview). Pushed to
`origin/master`, deployed, and verified with a real Playwright login against
`https://www.theproperpainter.com/dashboard` — works.

One hiccup along the way worth remembering: right after the deploy went "Ready,"
the live domain 404'd on `/dashboard` for a few minutes — just Vercel edge
propagation lag, not a real failure. Don't assume broken on a 404 immediately
after a fresh deploy; recheck after a short wait before diagnosing further.

Also found and worked around: this Vercel account/org has **multiple projects
sharing similar names** — `vercel project inspect <name>` matched an unrelated
project by name collision. The local `.vercel/project.json` link was also stale/
broken (couldn't resolve). Added env vars via the Vercel **dashboard**, not the
CLI, to avoid writing to the wrong project. If CLI access to this project is
needed later, it needs a fresh `vercel link` done carefully, confirming scope.

**Available Cash headline: built and verified (2026-10-12).** Design decision:
shows the **raw live FNB balance**, not pre-reduced by known commitments — SW's
current balance owed is shown as a supporting line right below it instead, so
the headline number always exactly matches the bank and never bakes in a
lookahead-window judgment call. Confirmed correct against live data:
$3,349.38 + $4,525.26 = $7,874.64, SW balance $4,636.14 (read directly from the
sheet's own live "Balance Owed" cell — no need to reimplement the
charge/payment FIFO reconciliation in app code, the sheet already computes it).
`src/lib/dashboard/cash.ts` — if a Plaid balance is ever unreadable ("N/A"),
this is surfaced as a visible warning, never silently treated as $0.

**Calendar/jobs view: built and verified (2026-10-11).**
`src/lib/dashboard/jobs.ts` reads `Schedule Input`, applies the same
"Complete jobs are hidden" rule as `autoAssignCalSlots` in the Apps Script, so
the calendar and the spreadsheet never disagree about which jobs are active.
`src/lib/dashboard/calendar-utils.ts` (unit-tested directly — month grid
padding, year wraparound, day-range matching all confirmed) +
`src/components/dashboard/month-calendar.tsx` render a Sunday-start month grid
with prev/next navigation via `?year=&month=` search params (plain links, no
client JS needed).

**Deliberate simplification vs. the old Sheets calendar:** each day cell lists
the jobs active that day as small chips — there is **no Cal-Slot-style
row/lane assignment or spanning-bar rendering**. That slot-assignment logic was
the single biggest source of bugs in the Sheets version (duplicate rows,
overlapping slots, the whole `autoAssignCalSlots` script existing to fix
exactly this). A day-by-day chip list shows the same information with far
less code and no possible slot-collision bug class. Revisit only if this
genuinely feels worse in practice than the old spanning-bar view.

Verified end-to-end with Playwright against the live site: current month
(October 2026) correctly shows 7 real jobs on their actual dates (e.g. "Ellen
Dillinger" Oct 4–6, "Kate Tomlinson" Oct 9), today (Oct 11) highlighted,
Prev/Next navigation moves through Sep → Oct → Nov correctly, and a screenshot
was reviewed to confirm the visual layout holds up.

**Still needed:** SW due-date (Net 30/FIFO) logic for a *future* bills-due
panel (today's total SW balance is already live; per-invoice due dates for
calendar placement are separate, deferred), the Recurring Bills list and UI,
Payroll integration into the calendar, and the deposit-received badge on job
chips (Invoices tab lookup by DripJobs ID). The data layer, the access gate,
the Available Cash headline, and the calendar/jobs view are all done and
proven in production.

## Time log note

This plan and the underlying Sheets work (Plaid, DripJobs Zaps, SW sync) fall under
the same billing tracking as the rest of the financial-workbook project — see
`docs/Financial Workbook/TIME_LOG.md`.
