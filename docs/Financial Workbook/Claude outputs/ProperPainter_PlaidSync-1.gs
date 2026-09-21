/**
 * THE PROPER PAINTER — Plaid Sync for Google Sheets
 * ==================================================
 * Replaces plaid_sync.py + ProperPainter_VBA.bas
 *
 * Balance-only: fetches FNB checking account balances and writes them to
 * rows 3–4 of the Transactions Log sheet. Does NOT import transactions.
 *
 * SETUP (one-time):
 *   1. In Google Sheets → Extensions → Apps Script → paste this file
 *   2. Reload the spreadsheet so the 🎨 menu appears
 *   3. Run 🎨 → Setup / Re-configure Credentials
 *   4. Run 🎨 → Update Account Balances Only  (fast — just shows balances)
 *   5. Run 🎨 → Install Daily Auto-Sync       (runs every morning at 6 AM)
 */

// ── Constants ────────────────────────────────────────────────────────────────

const PLAID_HOST = 'https://production.plaid.com';

// Sheet name — must match exactly
const SHEET_TRANSACTIONS = 'Transactions Log';


// ── Public entry points ──────────────────────────────────────────────────────

/**
 * Run once to store your Plaid credentials and account tokens securely.
 * Must be run from the 🎨 Proper Painter menu, not from the editor.
 */
function setupCredentials() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();

  let r = ui.prompt('Plaid Setup (1/3)',
    'Enter your Plaid CLIENT ID\n(from https://dashboard.plaid.com/developers/keys)',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const clientId = r.getResponseText().trim();
  if (!clientId) { ui.alert('Client ID cannot be empty.'); return; }

  r = ui.prompt('Plaid Setup (2/3)',
    'Enter your Plaid SECRET (production)',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const secret = r.getResponseText().trim();
  if (!secret) { ui.alert('Secret cannot be empty.'); return; }

  r = ui.prompt('Plaid Setup (3/3)',
    'Paste the contents of plaid_config.json here\n(the file created by plaid_setup.py)',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  let configJson = r.getResponseText().trim();
  if (!configJson) { ui.alert('Config cannot be empty.'); return; }

  let config;
  try {
    config = JSON.parse(configJson);
  } catch (e) {
    ui.alert('Invalid JSON. Please re-open plaid_config.json in Notepad and copy it again.');
    return;
  }

  const accounts = (config.accounts || []).map(a => ({
    name:         a.name,
    type:         a.type,
    institution:  a.institution,
    access_token: a.access_token,
    item_id:      a.item_id,
    cursor:       a.cursor || '',
  }));

  if (accounts.length === 0) {
    ui.alert('No accounts found in plaid_config.json. Complete plaid_setup.py first.');
    return;
  }

  props.setProperties({
    PLAID_CLIENT_ID: clientId,
    PLAID_SECRET:    secret,
    PLAID_ACCOUNTS:  JSON.stringify(accounts),
  });

  ui.alert(`✓ Setup complete!\n\n${accounts.length} account(s) configured:\n` +
    accounts.map(a => `  • ${a.name} (${a.type})`).join('\n') +
    '\n\nNow run "Update Account Balances Only" from the 🎨 menu to test.');
}


/**
 * Fetches ONLY the FNB account balances and writes them to rows 3–4.
 * Fast (2–3 seconds). Use this for a quick balance refresh.
 */
function updateBalancesOnly() {
  const props    = PropertiesService.getScriptProperties();
  const clientId = props.getProperty('PLAID_CLIENT_ID');
  const secret   = props.getProperty('PLAID_SECRET');
  const accounts = JSON.parse(props.getProperty('PLAID_ACCOUNTS') || '[]');

  if (!clientId || !secret) {
    SpreadsheetApp.getUi().alert('Plaid credentials not configured. Run Setup first.');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  _updateAccountBalances(ss, clientId, secret, accounts);

  ss.toast('Account balances updated in Transactions Log rows 3–4.', '🎨 Proper Painter', 5);
}


/**
 * Called automatically by the daily time-based trigger.
 * Balance-only — does NOT import transactions.
 */
function syncScheduled() {
  const props    = PropertiesService.getScriptProperties();
  const clientId = props.getProperty('PLAID_CLIENT_ID');
  const secret   = props.getProperty('PLAID_SECRET');
  const accounts = JSON.parse(props.getProperty('PLAID_ACCOUNTS') || '[]');

  if (!clientId || !secret) {
    Logger.log('Plaid credentials not configured — skipping scheduled balance update.');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  _updateAccountBalances(ss, clientId, secret, accounts);
}


/**
 * Install a daily trigger that runs syncScheduled() every morning at 6 AM.
 */
function installDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'syncScheduled') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('syncScheduled')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  SpreadsheetApp.getUi().alert(
    '✓ Daily sync installed.\n\nThe workbook will sync every morning at 6 AM automatically.'
  );
}


/**
 * Adds the 🎨 Proper Painter menu. Runs automatically when the spreadsheet opens.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎨 Proper Painter')
    .addItem('Update Account Balances Only', 'updateBalancesOnly')
    .addSeparator()
    .addItem('Assign Cal Slots Now',          'autoAssignCalSlots')
    .addItem('Install Auto Cal Slots',        'installSlotTrigger')
    .addItem('Import Jobs from CSV Tab (one-time)', 'importJobsFromCsvTab')
    .addSeparator()
    .addItem('Build Job Category Profitability Report', 'buildProfitabilityReport')
    .addSeparator()
    .addItem('Setup / Re-configure Credentials', 'setupCredentials')
    .addItem('Install Daily Auto-Sync',          'installDailyTrigger')
    .addToUi();
}


// ── Core balance logic ───────────────────────────────────────────────────────

/**
 * Fetches real-time balances for ***2694 and ***6475 and writes them to
 * rows 3–4 of the Transactions Log sheet.
 *
 * Only queries accounts that are NOT credit cards (skips SW credit account
 * to keep this fast — credit balance isn't needed here).
 */
function _updateAccountBalances(ss, clientId, secret, accounts) {
  const sheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  if (!sheet) {
    Logger.log(`Sheet "${SHEET_TRANSACTIONS}" not found — skipping balance update.`);
    return;
  }

  const today = Utilities.formatDate(
    new Date(), Session.getScriptTimeZone(), 'MM/dd/yyyy'
  );

  const TARGET_MASKS = ['2694', '6475'];
  const balanceMap   = {};

  // Skip credit card accounts — only query checking/depository to stay fast
  const depositAccounts = accounts.filter(a => {
    const t = (a.type || '').toLowerCase();
    return t !== 'credit';
  });

  Logger.log(`Fetching balances from ${depositAccounts.length} non-credit account(s)...`);

  for (const account of depositAccounts) {
    try {
      const payload = {
        client_id:    clientId,
        secret:       secret,
        access_token: account.access_token,
      };

      const response = UrlFetchApp.fetch(`${PLAID_HOST}/accounts/balance/get`, {
        method:             'post',
        contentType:        'application/json',
        payload:            JSON.stringify(payload),
        muteHttpExceptions: true,
      });

      const code = response.getResponseCode();
      const data = JSON.parse(response.getContentText());

      if (code !== 200) {
        Logger.log(`Balance API error for ${account.name}: ${
          data.error_message || JSON.stringify(data)
        }`);
        if (data.error_code === 'ITEM_LOGIN_REQUIRED') {
          _alertLoginRequired(account.name);
        }
        continue;
      }

      for (const acct of data.accounts) {
        const rawMask = (acct.mask || '').trim();
        Logger.log(`  Account from API: "${acct.name}" mask="${rawMask}" available=${acct.balances.available} current=${acct.balances.current}`);
        // Use endsWith so Plaid masks like "X2694" or "02694" still match "2694"
        const matchedTarget = TARGET_MASKS.find(t => rawMask === t || rawMask.endsWith(t));
        if (matchedTarget) {
          const bal = acct.balances.available ?? acct.balances.current ?? 0;
          balanceMap[matchedTarget] = bal;
          Logger.log(`  ✓ Matched ***${matchedTarget}: $${bal}`);
        }
      }

    } catch (e) {
      Logger.log(`  Error fetching balance for ${account.name}: ${e.message}`);
    }
  }

  // Safety: rows 3–4 are reserved for the balances. If anything else is in
  // A3:A4 (e.g. a transaction moved up into them), do NOT overwrite it.
  const existingLabels = sheet.getRange(3, 1, 2, 1).getValues().map(r => String(r[0] || '').trim());
  const blocked = existingLabels.some(v => v !== '' && v.indexOf('Business Checking') !== 0);
  if (blocked) {
    const msg = `Balance update skipped: rows 3–4 of "${SHEET_TRANSACTIONS}" contain other data. ` +
                'Keep those two rows free for the Plaid balances.';
    Logger.log(msg);
    ss.toast(msg, '🎨 Proper Painter', 10);
    return;
  }

  // Always write rows 3–4 (show N/A if a balance couldn't be fetched)
  const rows = TARGET_MASKS.map(mask => [
    `Business Checking ***${mask}`,
    balanceMap[mask] !== undefined ? balanceMap[mask] : 'N/A',
    `as of ${today}`,
  ]);

  sheet.getRange(3, 1, 2, 3).setValues(rows);
  sheet.getRange(3, 2, 2, 1).setNumberFormat('$#,##0.00');

  Logger.log(`Balance rows written to rows 3–4 of ${SHEET_TRANSACTIONS}`);
}


/**
 * Emails the script owner when Plaid says a bank connection needs the user to
 * log in again (ITEM_LOGIN_REQUIRED). Sends at most one email per account per
 * 24 hours so the daily trigger doesn't spam.
 */
function _alertLoginRequired(accountName) {
  const props = PropertiesService.getScriptProperties();
  const key   = 'LOGIN_ALERT_SENT_' + accountName.replace(/\W+/g, '_');
  const last  = Number(props.getProperty(key) || 0);
  if (Date.now() - last < 24 * 60 * 60 * 1000) return;

  try {
    const to = Session.getEffectiveUser().getEmail();
    MailApp.sendEmail(
      to,
      `Action needed: re-link ${accountName} (Plaid)`,
      `Plaid can't fetch balances for "${accountName}" because the bank needs you to log in again ` +
      `(ITEM_LOGIN_REQUIRED).\n\n` +
      `To fix it:\n` +
      `  1. On the computer with the PlaidSync folder, run:  python plaid_relink.py\n` +
      `  2. Pick "${accountName}" and log in to the bank in the browser window.\n` +
      `  3. In the sheet, run 🎨 Proper Painter → Update Account Balances Only.\n\n` +
      `No Apps Script changes are needed — the existing connection is restored.\n\n` +
      `(You'll get at most one of these emails per day until it's fixed.)`
    );
    props.setProperty(key, String(Date.now()));
    Logger.log(`Login-required alert emailed to ${to}`);
  } catch (e) {
    Logger.log(`Could not send login-required alert: ${e.message}`);
  }
}


// ── Auto-assign Cal Slots ────────────────────────────────────────────────────

const SHEET_SCHEDULE_INPUT = 'Schedule Input';
const MAX_CAL_SLOTS        = 5;

/**
 * Fills the "Cal Slot (1–5)" column (E) of Schedule Input automatically.
 *
 * Jobs are processed alphabetically by customer name. Each job gets the lowest
 * slot (1–5) not already used by an overlapping job that was placed before it.
 * Jobs that don't overlap in time can share a slot. Rows with no start date are
 * left alone. If more than 5 jobs overlap, the extra job's slot is left blank
 * and a warning is shown.
 *
 * NOTE: this overwrites any slot numbers typed by hand in column E.
 */
function autoAssignCalSlots() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;   // another run is in progress

  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_SCHEDULE_INPUT);
    if (!sheet) return;

    // Headers are in row 1; jobs start in row 2
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    const numRows = lastRow - 1;
    const values  = sheet.getRange(2, 1, numRows, 8).getValues();   // A:H, from row 2

    const toDay = v => {
      const d = v instanceof Date ? v : new Date(v);
      return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    };

    // Build the list of jobs that have a usable start date.
    // Completed jobs get NO slot, which removes them from the calendar
    // (the calendar only shows jobs that have a slot) and frees the slot for others.
    const jobs = [];
    const completedIdx = [];
    values.forEach((row, i) => {
      const name  = String(row[0] || '').trim();
      if (/complete/i.test(String(row[7] || ''))) {          // column H = Status
        if (name) completedIdx.push(i);
        return;
      }
      const start = row[1] === '' ? null : toDay(row[1]);
      if (!name || start === null) return;
      const end = row[2] === '' ? start : (toDay(row[2]) ?? start);
      jobs.push({ idx: i, name: name, start: start, end: Math.max(start, end) });
    });

    // Alphabetical by customer, then earlier start, then sheet order
    jobs.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()) ||
      a.start - b.start ||
      a.idx - b.idx
    );

    const placed   = [];
    const overflow = [];
    jobs.forEach(job => {
      const used = new Set(
        placed.filter(p => p.start <= job.end && p.end >= job.start).map(p => p.slot)
      );
      let slot = 0;
      for (let s = 1; s <= MAX_CAL_SLOTS; s++) {
        if (!used.has(s)) { slot = s; break; }
      }
      job.slot = slot;
      if (slot) placed.push(job); else overflow.push(job.name);
    });

    // Write column E only (one call), leaving rows we didn't touch as they were
    const slotCol = values.map(r => [r[4]]);
    jobs.forEach(job => { slotCol[job.idx][0] = job.slot || ''; });
    completedIdx.forEach(i => { slotCol[i][0] = ''; });
    sheet.getRange(2, 5, numRows, 1).setValues(slotCol);

    if (overflow.length) {
      const msg = `More than ${MAX_CAL_SLOTS} jobs overlap — no slot for: ${overflow.join(', ')}`;
      Logger.log(msg);
      ss.toast(msg, '🎨 Proper Painter', 10);
    }
  } finally {
    lock.releaseLock();
  }
}


/**
 * Runs autoAssignCalSlots automatically whenever the spreadsheet changes
 * (including changes made by Zapier). Run once from the 🎨 menu.
 * Changes made by the script itself do not re-trigger it.
 */
function installSlotTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'autoAssignCalSlots') ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger('autoAssignCalSlots')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onChange()
    .create();

  SpreadsheetApp.getUi().alert(
    '✓ Auto Cal Slots installed.\n\nSlots in Schedule Input column E will be ' +
    'assigned automatically whenever the sheet changes.'
  );
}


// ── One-time import of DripJobs "Jobs List" CSV ──────────────────────────────

const SHEET_JOBS_IMPORT  = 'Jobs Import';
const SHEET_IMPORT_REPORT = 'Import Report';
const NEEDS_ID_TEXT      = 'NEEDS ID';

/**
 * One-time load of existing DripJobs projects into Schedule Input.
 *
 * BEFORE RUNNING: File → Import → upload the DripJobs Jobs_List CSV →
 * "Insert new sheet(s)", then rename that new tab to  Jobs Import.
 *
 * Rules:
 *  - Row is skipped if Schedule Input already has the same name + start date.
 *  - Row is NOT imported (listed on the "Import Report" tab for you to review)
 *    if the name exists in Schedule Input but the dates differ.
 *  - Everything else is appended below the last job.
 *  - Completed jobs are imported with DripJobs ID blank (the Zap won't touch them).
 *  - Active jobs (not "Project Complete") get "NEEDS ID" in column I, highlighted
 *    yellow. Paste the real ID (end of the Work Order link) over it.
 *  - Contract ($) = CSV Amount, Balance Owed ($) = CSV Balance (one-time snapshot).
 *  - Nothing in DripJobs is changed, and existing rows are never modified.
 */
function importJobsFromCsvTab() {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const ui     = SpreadsheetApp.getUi();
  const src    = ss.getSheetByName(SHEET_JOBS_IMPORT);
  const target = ss.getSheetByName(SHEET_SCHEDULE_INPUT);

  if (!src)    { ui.alert(`Tab "${SHEET_JOBS_IMPORT}" not found. Import the CSV as a new sheet and rename it first.`); return; }
  if (!target) { ui.alert(`Tab "${SHEET_SCHEDULE_INPUT}" not found.`); return; }

  // Read the CSV tab into objects keyed by header name
  const srcValues = src.getDataRange().getValues();
  const headers   = srcValues[0].map(h => String(h).trim());
  const need = ['Job', 'Deal Stage', 'Job Start Date', 'Job Completion Date', 'Job Scheduled Date', 'Crew', 'Amount', 'Balance'];
  const missing = need.filter(h => headers.indexOf(h) === -1);
  if (missing.length) { ui.alert('The import tab is missing column(s): ' + missing.join(', ')); return; }

  const importRows = srcValues.slice(1)
    .filter(r => String(r[headers.indexOf('Job')] || '').trim() !== '')
    .map(r => { const o = {}; headers.forEach((h, i) => { o[h] = r[i]; }); return o; });

  // Locate Schedule Input columns by header name (row 1)
  const tHeaders = target.getRange(1, 1, 1, Math.max(target.getLastColumn(), 9)).getValues()[0].map(h => String(h).trim());
  const col = name => tHeaders.indexOf(name);
  const cName = col('Job / Customer'), cStart = col('Start Date'), cEnd = col('End Date'),
        cCrew = col('Crew'), cContract = col('Contract ($)'), cBal = col('Balance Owed ($)'),
        cStatus = col('Status'), cId = col('DripJobs ID');
  if ([cName, cStart, cEnd, cCrew, cContract, cBal, cStatus, cId].some(c => c === -1)) {
    ui.alert('Schedule Input headers not as expected in row 1 (need Job / Customer, Start Date, End Date, Crew, Contract ($), Balance Owed ($), Status, DripJobs ID).');
    return;
  }

  // Existing jobs + the first empty row in column A
  const lastRow = Math.max(target.getLastRow(), 1);
  const existing = lastRow > 1 ? target.getRange(2, 1, lastRow - 1, tHeaders.length).getValues() : [];
  let lastUsed = 1;
  existing.forEach((r, i) => { if (String(r[cName] || '').trim() !== '') lastUsed = i + 2; });
  const existingJobs = existing
    .filter(r => String(r[cName] || '').trim() !== '')
    .map(r => ({ name: r[cName], start: r[cStart], contract: r[cContract] }));

  const plan = _planJobImport(importRows, existingJobs, new Date());

  if (plan.toImport.length) {
    const width = Math.max(tHeaders.length, 9);
    const out = plan.toImport.map(j => {
      const row = new Array(width).fill('');
      row[cName] = j.name;   row[cStart] = j.start || '';  row[cEnd] = j.end || '';
      row[cCrew] = j.crew;   row[cContract] = j.contract;  row[cBal] = j.balance;
      row[cStatus] = j.status; row[cId] = j.needsId ? NEEDS_ID_TEXT : '';
      return row;
    });
    const firstRow = lastUsed + 1;
    const needRows = firstRow + out.length - 1 - target.getMaxRows();
    if (needRows > 0) target.insertRowsAfter(target.getMaxRows(), needRows);

    target.getRange(firstRow, 1, out.length, width).setValues(out);
    target.getRange(firstRow, cStart + 1, out.length, 2).setNumberFormat('m/d/yyyy');
    target.getRange(firstRow, cContract + 1, out.length, 1).setNumberFormat('$#,##0.00');
    target.getRange(firstRow, cBal + 1, out.length, 1).setNumberFormat('$#,##0.00');
    plan.toImport.forEach((j, i) => {
      if (j.needsId) target.getRange(firstRow + i, cId + 1).setBackground('#ffff00');
    });
  }

  // Report tab
  let rep = ss.getSheetByName(SHEET_IMPORT_REPORT);
  if (!rep) rep = ss.insertSheet(SHEET_IMPORT_REPORT); else rep.clear();
  const repRows = [
    ['Import run', new Date()],
    ['Imported', plan.toImport.length],
    ['  of which need a DripJobs ID (active jobs)', plan.toImport.filter(j => j.needsId).length],
    ['Skipped (already in Schedule Input)', plan.skipped],
    ['Not imported — name exists, dates differ (review)', plan.review.length],
    [],
    ['REVIEW: name already in Schedule Input, dates differ', 'CSV start', 'CSV stage', 'CSV contract'],
  ].concat(plan.review.map(j => [j.name, j.start || '', j.status, j.contract]));
  const w = Math.max.apply(null, repRows.map(r => r.length));
  rep.getRange(1, 1, repRows.length, w).setValues(repRows.map(r => r.concat(new Array(w - r.length).fill(''))));
  rep.setColumnWidth(1, 380);

  autoAssignCalSlots();

  ui.alert(
    `Import finished.\n\nImported: ${plan.toImport.length}\n` +
    `  needing a DripJobs ID (yellow "${NEEDS_ID_TEXT}"): ${plan.toImport.filter(j => j.needsId).length}\n` +
    `Skipped (already there): ${plan.skipped}\n` +
    `Held back for review: ${plan.review.length}\n\nDetails are on the "${SHEET_IMPORT_REPORT}" tab.`
  );
}


/**
 * Pure logic (no sheet access): decides which CSV rows to import.
 * importRows: objects keyed by CSV header. existingJobs: [{name, start, contract}].
 */
function _planJobImport(importRows, existingJobs, today) {
  const norm = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const day  = d => d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() : null;

  const existing = {};   // name → [{start, contract}]
  existingJobs.forEach(j => {
    const d = _parseCsvDate(j.start, today);
    (existing[norm(j.name)] = existing[norm(j.name)] || []).push({ start: day(d), contract: _parseMoney(j.contract) });
  });

  const plan = { toImport: [], skipped: 0, review: [] };

  importRows.forEach(r => {
    const name   = String(r['Job'] || '').trim();
    const status = String(r['Deal Stage'] || '').trim();

    let start = _parseCsvDate(r['Job Start Date'], today);
    let end   = _parseCsvDate(r['Job Completion Date'], today);
    if (!start) {
      const range = _parseScheduledRange(r['Job Scheduled Date'], today);
      if (range) { start = range.start; if (!end) end = range.end; }
    }
    if (start && !end) end = start;          // one-day placeholder so the calendar can show it
    if (start && end && end < start) end = start;

    const job = {
      name: name,
      start: start, end: end,
      crew: String(r['Crew'] || '').trim(),
      contract: _parseMoney(r['Amount']),
      balance:  _parseMoney(r['Balance']),
      status: status,
      needsId: status !== 'Project Complete',
    };

    const matches = existing[norm(name)];
    if (!matches) { plan.toImport.push(job); return; }

    const sameStart = start && matches.some(m => m.start === day(start));
    const sameBlank = !start && matches.some(m => m.start === null && m.contract === job.contract);
    if (sameStart || sameBlank) plan.skipped++;
    else plan.review.push(job);
  });

  return plan;
}


/** Accepts a Date, "MM/DD/YYYY", or junk like "N/A" → Date or null. */
function _parseCsvDate(v, today) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const s = String(v || '').trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return isNaN(d.getTime()) ? null : d;
}


/** "Mon. Oct 5 - Wed. Oct 7" → {start, end}; year is inferred (no year in the export). */
function _parseScheduledRange(v, today) {
  const s = String(v || '');
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const re = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})/gi;
  const found = [];
  let m;
  while ((m = re.exec(s)) !== null) found.push({ mon: months.indexOf(m[1].toLowerCase()), day: Number(m[2]) });
  if (!found.length) return null;

  const mk = (f, year) => new Date(year, f.mon, f.day);
  let year = today.getFullYear();
  let start = mk(found[0], year);
  // Dates are upcoming: if it lands far in the past, it belongs to next year
  if (today.getTime() - start.getTime() > 120 * 86400000) { year++; start = mk(found[0], year); }
  let end = found.length > 1 ? mk(found[1], year) : start;
  if (end < start) end = mk(found[1], year + 1);
  return { start: start, end: end };
}


/** "$1,240.00" or 1240 → number (0 if blank/invalid). */
function _parseMoney(v) {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v || '').replace(/[$,\s]/g, ''));
  return isNaN(n) ? 0 : n;
}


// ── Job Category Profitability Report ────────────────────────────────────────

/**
 * Reads the Job Costing sheet, aggregates revenue/cost by job category,
 * writes a "Job Category Analysis" summary sheet, and inserts two charts:
 *   1. Clustered bar  — Revenue vs. Gross Profit by category
 *   2. Pie chart      — Gross Profit share by category
 *
 * Run from 🎨 → Build Job Category Profitability Report
 */
function buildProfitabilityReport() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── 1. Find the Job Costing sheet ──────────────────────────────────────────
  const JOB_COSTING_NAMES = ['Job Costing', 'Job Cost', 'Job Costs', 'Job Costing Sheet', 'Projects'];
  let jobSheet = null;
  for (const n of JOB_COSTING_NAMES) {
    jobSheet = ss.getSheetByName(n);
    if (jobSheet) break;
  }
  if (!jobSheet) {
    // Try a case-insensitive partial match
    const allSheets = ss.getSheets();
    jobSheet = allSheets.find(s => s.getName().toLowerCase().includes('job') ||
                                   s.getName().toLowerCase().includes('cost'));
  }
  if (!jobSheet) {
    ui.alert('Could not find the Job Costing sheet.\n\nPlease rename it to "Job Costing" and try again.');
    return;
  }

  Logger.log(`Using sheet: "${jobSheet.getName()}"`);

  try {
    _buildJobCategoryAnalysis(ss, jobSheet);
    ui.alert('✓ Job Category Analysis sheet built!\n\nCheck the "Job Category Analysis" tab for the profitability breakdown and charts.');
  } catch (e) {
    ui.alert(`Error building report:\n\n${e.message}`);
    Logger.log(`ERROR in buildProfitabilityReport: ${e.stack}`);
  }
}


/**
 * Core logic: reads jobSheet, aggregates by category, writes the analysis tab.
 *
 * Expected columns in the Job Costing sheet (auto-detected by header name):
 *   Category / Job Type / Work Type / Trade / Service Type
 *   Revenue  / Contract Amount / Price / Billed / Contract Price
 *   Labor    / Labor Cost / Labor Hours / Payroll
 *   Materials / Material Cost / Supplies / Paint / Material
 *   Other Costs / Expenses / Other Expense / Overhead
 *   (Gross Profit and Margin are calculated here if not present)
 */
function _buildJobCategoryAnalysis(ss, jobSheet) {
  // ── A. Read the job costing data ───────────────────────────────────────────
  const allData = jobSheet.getDataRange().getValues();
  if (allData.length < 2) throw new Error('Job Costing sheet appears to be empty.');

  // Scan past title/blank rows to find the actual header row
  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(allData.length, 10); r++) {
    const nonEmpty = allData[r].filter(c => String(c).trim() !== '').length;
    if (nonEmpty >= 3) { headerRowIndex = r; break; }
  }
  Logger.log(`Using row ${headerRowIndex + 1} as header row`);

  const headers = allData[headerRowIndex].map(h => String(h).trim().toLowerCase());
  Logger.log(`Job Costing headers: ${JSON.stringify(headers)}`);

  // Flexible column finder — checks full match first, then partial
  function findCol(candidates) {
    for (const c of candidates) {
      const idx = headers.findIndex(h => h === c);
      if (idx >= 0) return idx;
    }
    for (const c of candidates) {
      const idx = headers.findIndex(h => h.includes(c));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  // Map to actual Proper Painter column names
  // Headers: Customer | Job Category | Contract ($) | Materials ($) |
  //          Randy / Sub ($) | Crew Labor ($) | Trans. Fees ($) | Profit ($) | Margin % | Status
  const colCategory  = findCol(['job category', 'category', 'job type', 'work type', 'trade', 'service type']);
  const colRevenue   = findCol(['contract ($)', 'contract amount', 'contract price', 'contract', 'revenue', 'price', 'billed', 'income']);
  const colMaterial  = findCol(['materials ($)', 'material cost', 'materials', 'supplies', 'paint', 'material']);
  const colRandySub  = findCol(['randy / sub ($)', 'randy', 'sub ($)', 'subcontractor', 'sub labor', 'sub cost']);
  const colCrewLabor = findCol(['crew labor ($)', 'crew labor', 'labor cost', 'labor', 'payroll', 'wages', 'crew']);
  const colTransFees = findCol(['trans. fees ($)', 'trans. fees', 'transaction fees', 'trans fee', 'fees ($)', 'fees']);
  const colProfit    = findCol(['profit ($)', 'gross profit', 'profit', 'net profit']);
  const colMarginPct = findCol(['margin %', 'margin pct', 'gp %', 'profit %', 'margin']);

  Logger.log(`Column map — category:${colCategory} revenue:${colRevenue} material:${colMaterial} ` +
    `randySub:${colRandySub} crewLabor:${colCrewLabor} transFees:${colTransFees} ` +
    `profit:${colProfit} margin:${colMarginPct}`);

  if (colCategory === -1) {
    throw new Error(
      'Could not find a "Job Category" column in the Job Costing sheet.\n' +
      `Found headers: ${allData[headerRowIndex].join(', ')}`
    );
  }
  if (colRevenue === -1 && colProfit === -1) {
    throw new Error(
      'Could not find a "Contract ($)" or "Profit ($)" column.\n' +
      `Found headers: ${allData[headerRowIndex].join(', ')}`
    );
  }

  // ── B. Aggregate by category ───────────────────────────────────────────────
  // totals: { revenue, materials, randySub, crewLabor, transFees, profit, jobCount }
  const totals = {};

  for (let r = headerRowIndex + 1; r < allData.length; r++) {
    const row      = allData[r];
    const category = String(row[colCategory] || '').trim();
    if (!category) continue;  // skip blank/total rows

    const revenue   = colRevenue   >= 0 ? (Number(row[colRevenue])   || 0) : 0;
    const materials = colMaterial  >= 0 ? (Number(row[colMaterial])  || 0) : 0;
    const randySub  = colRandySub  >= 0 ? (Number(row[colRandySub])  || 0) : 0;
    const crewLabor = colCrewLabor >= 0 ? (Number(row[colCrewLabor]) || 0) : 0;
    const transFees = colTransFees >= 0 ? (Number(row[colTransFees]) || 0) : 0;

    // Use Profit ($) directly from sheet when available; otherwise calculate
    let profit;
    if (colProfit >= 0 && row[colProfit] !== '' && row[colProfit] !== null && row[colProfit] !== 0) {
      profit = Number(row[colProfit]) || 0;
    } else {
      profit = revenue - materials - randySub - crewLabor - transFees;
    }

    if (!totals[category]) {
      totals[category] = { revenue: 0, materials: 0, randySub: 0, crewLabor: 0, transFees: 0, profit: 0, jobCount: 0 };
    }
    totals[category].revenue   += revenue;
    totals[category].materials += materials;
    totals[category].randySub  += randySub;
    totals[category].crewLabor += crewLabor;
    totals[category].transFees += transFees;
    totals[category].profit    += profit;
    totals[category].jobCount  += 1;
  }

  const categories = Object.keys(totals).sort((a, b) => totals[b].profit - totals[a].profit);
  if (categories.length === 0) throw new Error('No category data found in the Job Costing sheet.');
  Logger.log(`Found ${categories.length} categories: ${categories.join(', ')}`);

  // ── C. Create / clear the analysis sheet ───────────────────────────────────
  const ANALYSIS_SHEET = 'Job Category Analysis';
  let analysisSheet = ss.getSheetByName(ANALYSIS_SHEET);
  if (analysisSheet) {
    analysisSheet.getCharts().forEach(c => analysisSheet.removeChart(c));
    analysisSheet.clearContents();
    analysisSheet.clearFormats();
  } else {
    analysisSheet = ss.insertSheet(ANALYSIS_SHEET);
    const jobIdx = ss.getSheets().indexOf(jobSheet);
    ss.moveActiveSheet(jobIdx + 2);
  }

  // ── D. Write the summary table ─────────────────────────────────────────────
  // Columns: Job Category | # Jobs | Contract ($) | Materials ($) | Randy/Sub ($) | Crew Labor ($) | Trans Fees ($) | Profit ($) | Margin %
  const NUM_COLS   = 9;
  const HEADER_ROW = 2;
  const DATA_START = 3;

  // Title
  analysisSheet.getRange(1, 1, 1, NUM_COLS).merge()
    .setValue('JOB CATEGORY PROFITABILITY ANALYSIS')
    .setFontSize(14).setFontWeight('bold')
    .setBackground('#1a3a5c').setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  // Header row
  const tableHeaders = [
    'Job Category', '# Jobs', 'Contract ($)', 'Materials ($)',
    'Randy / Sub ($)', 'Crew Labor ($)', 'Trans. Fees ($)', 'Profit ($)', 'Margin %'
  ];
  analysisSheet.getRange(HEADER_ROW, 1, 1, NUM_COLS).setValues([tableHeaders])
    .setFontWeight('bold').setBackground('#2d6a9f').setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  // Data rows — sorted by profit (highest first)
  const dataRows = categories.map(cat => {
    const t      = totals[cat];
    const margin = t.revenue > 0 ? t.profit / t.revenue : 0;
    return [cat, t.jobCount, t.revenue, t.materials, t.randySub, t.crewLabor, t.transFees, t.profit, margin];
  });
  analysisSheet.getRange(DATA_START, 1, dataRows.length, NUM_COLS).setValues(dataRows);

  // Totals row
  const totalRow       = DATA_START + categories.length;
  const grandRevenue   = categories.reduce((s, c) => s + totals[c].revenue,   0);
  const grandMaterials = categories.reduce((s, c) => s + totals[c].materials, 0);
  const grandRandySub  = categories.reduce((s, c) => s + totals[c].randySub,  0);
  const grandCrewLabor = categories.reduce((s, c) => s + totals[c].crewLabor, 0);
  const grandTransFees = categories.reduce((s, c) => s + totals[c].transFees, 0);
  const grandProfit    = categories.reduce((s, c) => s + totals[c].profit,    0);
  const grandJobCount  = categories.reduce((s, c) => s + totals[c].jobCount,  0);
  const grandMargin    = grandRevenue > 0 ? grandProfit / grandRevenue : 0;

  analysisSheet.getRange(totalRow, 1, 1, NUM_COLS).setValues([[
    'TOTAL', grandJobCount, grandRevenue, grandMaterials,
    grandRandySub, grandCrewLabor, grandTransFees, grandProfit, grandMargin
  ]]).setFontWeight('bold').setBackground('#d9e8f7')
    .setBorder(true, null, null, null, null, null);

  // ── E. Formatting ──────────────────────────────────────────────────────────
  // Alternate row shading
  for (let r = 0; r < categories.length; r++) {
    analysisSheet.getRange(DATA_START + r, 1, 1, NUM_COLS)
      .setBackground(r % 2 === 0 ? '#f0f4f9' : '#ffffff');
  }

  // Number formats
  const moneyFmt = '$#,##0.00';
  const pctFmt   = '0.0%';
  const intFmt   = '#,##0';
  const numRows  = categories.length + 1;  // data + totals
  analysisSheet.getRange(DATA_START, 2, numRows, 1).setNumberFormat(intFmt);
  analysisSheet.getRange(DATA_START, 3, numRows, 6).setNumberFormat(moneyFmt);
  analysisSheet.getRange(DATA_START, 9, numRows, 1).setNumberFormat(pctFmt);

  // Margin % heat map — green ≥30%, yellow 15–29%, red <15%
  for (let r = 0; r < categories.length; r++) {
    const cat    = categories[r];
    const margin = totals[cat].revenue > 0 ? totals[cat].profit / totals[cat].revenue : 0;
    const bg     = margin >= 0.30 ? '#c6efce' : margin >= 0.15 ? '#ffeb9c' : '#ffc7ce';
    analysisSheet.getRange(DATA_START + r, 9).setBackground(bg);
  }

  // Column widths
  analysisSheet.setColumnWidth(1, 200);
  analysisSheet.setColumnWidth(2, 65);
  for (let c = 3; c <= 8; c++) analysisSheet.setColumnWidth(c, 115);
  analysisSheet.setColumnWidth(9, 90);

  analysisSheet.setFrozenRows(2);

  // ── F. Charts ──────────────────────────────────────────────────────────────
  const categoryRange = analysisSheet.getRange(HEADER_ROW, 1, categories.length + 1, 1);
  const revenueRange  = analysisSheet.getRange(HEADER_ROW, 3, categories.length + 1, 1);
  const profitRange   = analysisSheet.getRange(HEADER_ROW, 8, categories.length + 1, 1);

  // Chart 1: Contract $ vs Profit $ by category (horizontal bar)
  const barChart = analysisSheet.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(categoryRange)
    .addRange(revenueRange)
    .addRange(profitRange)
    .setPosition(totalRow + 3, 1, 0, 0)
    .setOption('title', 'Contract Revenue vs. Profit by Job Category')
    .setOption('legend', { position: 'bottom' })
    .setOption('width', 620)
    .setOption('height', 340)
    .setOption('colors', ['#2d6a9f', '#28a745'])
    .setOption('hAxis', { format: '$#,##0', title: 'Amount ($)' })
    .setOption('vAxis', { title: 'Job Category' })
    .build();
  analysisSheet.insertChart(barChart);

  // Chart 2: Profit share donut — only positive-profit categories
  const positiveCats = categories.filter(c => totals[c].profit > 0);
  if (positiveCats.length > 0) {
    const PIE_COL = 11;  // column K — out of the way
    analysisSheet.getRange(HEADER_ROW, PIE_COL, 1, 2).setValues([['Category', 'Profit ($)']]);
    const pieData = positiveCats.map(c => [c, totals[c].profit]);
    analysisSheet.getRange(HEADER_ROW + 1, PIE_COL, positiveCats.length, 2).setValues(pieData);

    const pieChart = analysisSheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(analysisSheet.getRange(HEADER_ROW, PIE_COL, positiveCats.length + 1, 2))
      .setPosition(totalRow + 3, 6, 0, 0)
      .setOption('title', 'Profit Share by Job Category')
      .setOption('width', 480)
      .setOption('height', 340)
      .setOption('pieHole', 0.4)
      .setOption('legend', { position: 'right' })
      .build();
    analysisSheet.insertChart(pieChart);

    // Gray out the helper data so it's not distracting
    analysisSheet.getRange(HEADER_ROW, PIE_COL, positiveCats.length + 1, 2)
      .setFontColor('#cccccc').setFontSize(8);
  }

  Logger.log(`Job Category Analysis sheet built with ${categories.length} categories.`);
}
