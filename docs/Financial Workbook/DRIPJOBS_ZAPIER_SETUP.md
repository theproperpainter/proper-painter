# DripJobs → Schedule Input (Zapier Setup)

Keeps the **Schedule Input** sheet in sync with the DripJobs Jobs pipeline.
Every time a project changes stage in DripJobs, one row in Schedule Input is
created or updated. **Rows are never deleted** — a finished job just gets the
status "Project Complete", so the history stays available for financial analysis.

Pipeline stages (shown in the Status column exactly as DripJobs names them):
`Project Accepted` → `Project Scheduled` → `Project in Progress` → `Project Complete`

> **Plan note:** this Zap has 3 steps (trigger + find row + update row), so it
> needs Zapier's **Pro** plan. The free plan only allows 2-step Zaps.
> Confirm this in Zapier before paying.

---

## Part 1 — Prepare the Google Sheet (one time)

### 1a. Move the headers to row 1 and add the DripJobs ID column
Zapier reads **row 1** as the column names, so the title row must go.
1. Open the **Schedule Input** tab.
2. Right-click row 1 (the title) → **Delete row**. The headers are now row 1 and
   jobs start in row 2. Google Sheets updates the calendar formulas automatically.
3. In cell **I1**, type the header: `DripJobs ID`
4. Match the formatting of the other headers (copy H1, paste onto I1).

This column is how Zapier recognizes a job. Names can be typed differently in
the sheet and in DripJobs, but the ID never changes.

### 1b-import. One-time import of existing projects (from the DripJobs CSV)
The DripJobs export has no project ID, so IDs can't be matched automatically.
The import handles that as follows:
- **Completed jobs** are imported with column I blank. They won't change stage again.
- **Active jobs** (In Progress / Scheduled / Accepted) are imported with a yellow
  **NEEDS ID** in column I. Paste the real ID over it (see 1b below) **before** the
  next stage change on that job, or the Zap will add a duplicate row.
- Jobs already in Schedule Input (same name + start date) are skipped. Same name with
  different dates is **held back** and listed on the **Import Report** tab for you to review.
- Contract ($) and Balance Owed ($) are filled from the CSV (a one-time snapshot).
- Jobs with a start date but no completion date get End = Start so the calendar can show them.

Steps:
1. In DripJobs, export the Jobs list CSV.
2. In the Google Sheet: **File → Import → Upload** the CSV → **Insert new sheet(s)**.
   Rename the new tab to exactly `Jobs Import`.
3. Paste the latest `.gs` into Apps Script and reload the sheet.
4. Run **🎨 Proper Painter → Import Jobs from CSV Tab (one-time)**. Approve any prompts.
5. Read the summary and the **Import Report** tab. Fix the yellow NEEDS ID cells.
6. Delete the `Jobs Import` tab when done (don't run the import twice with an updated CSV
   unless you want only new jobs added — re-running skips jobs already present).

### 1b. Fill in the ID for jobs already in the sheet  ⚠ do this before turning the Zap on
If you skip this, the first stage change for each existing job will create a
**duplicate row**.

For each existing job:
1. Open the project in DripJobs and look at its Work Order link:
   `https://app.dripjobs.com/crew/workorders/details/`**`92658247302ea41722b3654c979a62`**
2. The long code at the end is the Job ID. Paste it into column **I** on that job's row.

### 1c. Let the calendar see more rows
After the row-1 change, the Schedule Calendar only reads rows 2–28 of Schedule
Input, so new jobs added lower down (Zapier adds them at the bottom) would be
ignored. Extend it:
1. Open the **Schedule Calendar** tab.
2. Press **Ctrl+H** (Find and replace).
3. Find: `$28`  Replace with: `$500`
4. Search: **This sheet**. Tick **Also search within formulas**.
5. Click **Replace all**. (About 150 formulas change.)

### 1d. Cal Slots are automatic
DripJobs does not know about Cal Slots, so the Apps Script assigns them:
alphabetical by customer, each job getting the lowest slot (1–5) not used by an
overlapping job. Setup:
1. Paste the latest `ProperPainter_PlaidSync-1.gs` into Apps Script and reload the sheet.
2. Run **🎨 Proper Painter → Install Auto Cal Slots** once (approve the permission prompt).
3. Run **🎨 Proper Painter → Assign Cal Slots Now** to fill in the current jobs.

This **overwrites any slot numbers typed by hand** in column E. A job needs a
Start Date to get a slot. If more than 5 jobs overlap, the extra one is left
blank and a warning appears.

---

## Part 2 — Build the Zap

Create a new Zap named **DripJobs → Schedule Input**.

### Step 1 — Trigger
- App: **DripJobs**
- Event: **Project Stage Changed**
- Connect your DripJobs account, then **Test trigger**.
  (If nothing appears, move a project to another stage in DripJobs and test again.)

### Step 2 — Find the row
- App: **Google Sheets**
- Event: **Lookup Spreadsheet Row**
- Spreadsheet: your Proper Painter workbook
- Worksheet: **Schedule Input**
- Lookup column: **DripJobs ID** (column I)
- Lookup value: **Project Job Id** (from Step 1)
- Tick **"Create Google Sheets row if it doesn't exist yet"**, and when it asks
  for the new row's values, fill in:

  | Column | Value from DripJobs |
  |---|---|
  | Job / Customer | Project Job Name |
  | DripJobs ID | Project Job Id |
  | Status | Project New Deal Stage |

### Step 3 — Update the row
- App: **Google Sheets**
- Event: **Update Spreadsheet Row**
- Spreadsheet / Worksheet: same as Step 2
- Row: the row number **from Step 2**
- Map only these columns:

  | Sheet column | DripJobs field | Notes |
  |---|---|---|
  | H — Status | **Project New Deal Stage** | Always updates |
  | B — Start Date | **Project Job Start Date** | Pick the copy that shows a date in its preview |
  | C — End Date | **Project Job End Date** | Was empty in the test sample |

- **Leave A, D, E, F, G unmapped for now.** (E is filled by the script; see 1d. The rest: see "Later" below.)

### Turn it on, then test
1. In DripJobs, move one *real* job to a different stage.
2. Wait a minute, then check Zap History in Zapier for a green run.
3. Confirm in the sheet:
   - the correct row changed (no duplicate),
   - Status shows the new stage,
   - Start/End dates are dates (not text) and your manual Crew/Slot/Contract cells were **not** blanked.
4. Move the job to its previous stage if you don't want the change kept.

---

## Known limits

- **Only future changes are captured.** Zapier fires when a stage changes; it
  cannot pull the existing pipeline. Jobs already in the sheet update the next
  time their stage moves (that's why Part 1b matters).
- **Blank dates:** if DripJobs has no end date, the Zap may write a blank over one
  you typed by hand. Watch for this during testing. If it happens, tell Claude
  and we'll switch to a step that skips blank fields.
- **Contract ($):** `Project Amount` was 0 in the test sample. Re-test on a real
  job before mapping it to column F.
- **Crew:** DripJobs has a `Project Crew Name` field, but it was empty in the
  test. Map it to column D only if you actually fill it in DripJobs.
- **Balance Owed (G):** not covered here. See "Later."

## Later (not part of this setup)
- Map **Contract ($)** once DripJobs data is confirmed reliable.
- Second Zap on **New Payment Received** / **New Invoice Created** to keep
  Balance Owed current.
