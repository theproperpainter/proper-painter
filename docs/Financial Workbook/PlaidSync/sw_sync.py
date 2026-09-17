"""
THE PROPER PAINTER — Sherwin-Williams PRO+ Portal Sync
=======================================================
Logs into the SW PRO+ portal, downloads invoice and payment history data,
and writes two staging CSV files for import into the SW Credit Account tab.

Output files (written to the same directory as this script):
  staging_sw_invoices.csv   →  Invoice charges
  staging_sw_payments.csv   →  Payments made

Run manually or on a schedule via Task Scheduler:
  python sw_sync.py

Dependencies:
  pip install playwright python-dotenv
  playwright install chromium
"""

import os
import sys
import csv
import time
import logging
import datetime
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    print("ERROR: python-dotenv not installed. Run: pip install python-dotenv")
    sys.exit(1)

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    print("ERROR: playwright not installed. Run: pip install playwright && playwright install chromium")
    sys.exit(1)

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
ENV_PATH     = SCRIPT_DIR / '.env'
LOG_PATH     = SCRIPT_DIR / 'sw_sync.log'
OUT_INVOICES = SCRIPT_DIR / 'staging_sw_invoices.csv'
OUT_PAYMENTS = SCRIPT_DIR / 'staging_sw_payments.csv'
DOWNLOAD_DIR = SCRIPT_DIR / '_sw_downloads'

# ── SW Portal URLs (IBM WebSphere Commerce / WCS) ────────────────────────────
SW_LOGON_URL    = 'https://www.sherwin-williams.com/AjaxLogonForm?myAcctMain=1&catalogId=11051&langId=-1&storeId=10151'
SW_ACCOUNT_URL  = 'https://www.sherwin-williams.com/en-us/pro/pro-plus/account?myAcctMain=1&storeId=10151&langId=-1&catalogId=11051'
SW_INVOICES_URL = 'https://www.sherwin-williams.com/en-us/pro/pro-plus/account/invoices'
SW_PAYMENTS_URL = 'https://www.sherwin-williams.com/en-us/pro/pro-plus/account/PaymentHistoryView'

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    filename=LOG_PATH,
    level=logging.INFO,
    format='%(asctime)s  %(levelname)s  %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
log = logging.getLogger(__name__)

load_dotenv(ENV_PATH)

SW_EMAIL    = os.getenv('SWILLIAMS_EMAIL', '')
SW_PASSWORD = os.getenv('SWILLIAMS_PW', '')

# ── WCS login field names ─────────────────────────────────────────────────────
# IBM WebSphere Commerce uses logonId / logonPassword — not type="email"
LOGON_ID_SELECTORS = [
    'input[name="logonId"]',
    'input[id="logonId"]',
    'input[name="email"]',
    'input[id="email"]',
    'input[name="username"]',
    'input[name="user_email"]',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[type="email"]',
]
LOGON_PW_SELECTORS = [
    'input[name="logonPassword"]',
    'input[id="logonPassword"]',
    'input[name="password"]',
    'input[id="password"]',
    'input[autocomplete="current-password"]',
    'input[type="password"]',
]


def _dismiss_cookies(page):
    """Dismiss cookie consent banner if present."""
    for sel in [
        # SW-specific: the banner has plain text buttons, no special id
        'button:has-text("Accept All")',
        'button:has-text("Accept Cookies")',
        'button:has-text("I Accept")',
        # Generic fallbacks
        '#onetrust-accept-btn-handler',
        'button[id*="accept"]',
        'button[class*="accept"]',
        '[aria-label*="Accept"]',
    ]:
        try:
            page.click(sel, timeout=3_000)
            log.info(f"Dismissed cookie banner: {sel}")
            time.sleep(0.5)   # brief pause for banner animation to finish
            return
        except PlaywrightTimeout:
            pass


def _find_field(page, selectors: list, label: str, timeout=20_000):
    """
    Try each selector in order; return the first one found.
    Waits up to `timeout` ms for the first selector, then tries the rest quickly.
    Raises PlaywrightTimeout if none are found.
    """
    # Try the primary selector with full timeout
    try:
        el = page.wait_for_selector(selectors[0], timeout=timeout, state='visible')
        log.info(f"Found {label} field: {selectors[0]}")
        return el
    except PlaywrightTimeout:
        pass

    # Try the rest quickly
    for sel in selectors[1:]:
        try:
            el = page.wait_for_selector(sel, timeout=3_000, state='visible')
            log.info(f"Found {label} field: {sel}")
            return el
        except PlaywrightTimeout:
            continue

    # Last resort: dump all visible inputs to log for debugging
    try:
        inputs = page.evaluate("""
            () => Array.from(document.querySelectorAll('input')).map(i => ({
                name: i.name, id: i.id, type: i.type,
                placeholder: i.placeholder, visible: i.offsetParent !== null
            }))
        """)
        log.error(f"Could not find {label} field. Visible inputs on page: {inputs}")
    except Exception:
        log.error(f"Could not find {label} field and could not inspect page inputs.")

    raise PlaywrightTimeout(f"No {label} field found after trying all selectors")


def _save_debug_screenshot(page, name: str):
    """Save a screenshot to the script directory for debugging."""
    try:
        path = SCRIPT_DIR / f'debug_{name}.png'
        page.screenshot(path=str(path))
        log.info(f"Debug screenshot saved: {path.name}")
    except Exception as e:
        log.warning(f"Could not save debug screenshot: {e}")


def _login(page) -> bool:
    """
    Navigate to SW PRO+ portal login and sign in.
    Returns True on success, False if login fails.
    """
    log.info("Loading SW PRO+ login page...")
    page.goto(SW_LOGON_URL, wait_until='domcontentloaded', timeout=30_000)

    # If already redirected to the dashboard, we're logged in
    if _is_logged_in(page):
        log.info("Session already active — skipping login")
        return True

    _save_debug_screenshot(page, '01_login_page')
    _dismiss_cookies(page)
    _save_debug_screenshot(page, '02_after_cookie_dismiss')

    # Fill username
    try:
        email_field = _find_field(page, LOGON_ID_SELECTORS, 'email/logonId', timeout=20_000)
        email_field.fill(SW_EMAIL)  # fill() clears the field first
    except PlaywrightTimeout as e:
        log.error(f"Could not fill email field: {e}")
        _save_debug_screenshot(page, '03_no_email_field')
        return False

    # Fill password
    try:
        pw_field = _find_field(page, LOGON_PW_SELECTORS, 'password', timeout=10_000)
        pw_field.fill(SW_PASSWORD)
    except PlaywrightTimeout as e:
        log.error(f"Could not fill password field: {e}")
        _save_debug_screenshot(page, '04_no_password_field')
        return False

    _save_debug_screenshot(page, '05_form_filled')

    # Small pause — React forms sometimes need a moment after fill before submit registers
    time.sleep(0.8)

    # Submit
    submitted = False
    for sel in ['button[type="submit"]', 'input[type="submit"]',
                'button:has-text("Sign In")', 'button:has-text("Log In")',
                'button:has-text("Login")', 'a:has-text("Sign In")']:
        try:
            page.click(sel, timeout=3_000)
            submitted = True
            log.info(f"Clicked submit: {sel}")
            break
        except PlaywrightTimeout:
            continue

    if not submitted:
        # Fallback: press Enter in the password field
        log.warning("Could not find submit button — pressing Enter")
        try:
            pw_field.press('Enter')
            submitted = True
        except Exception as e:
            log.error(f"Enter key fallback failed: {e}")
            return False

    # Wait for navigation after submit
    try:
        page.wait_for_load_state('networkidle', timeout=25_000)
    except PlaywrightTimeout:
        pass  # page might have settled without triggering networkidle

    _save_debug_screenshot(page, '06_after_submit')

    # Retry for up to 20s -- the SW SPA redirect can be slow
    for attempt in range(10):
        if _is_logged_in(page):
            log.info(f'Login successful (attempt {attempt + 1})')
            return True
        log.info(f'  Waiting for redirect... ({attempt + 1}/10)')
        time.sleep(2.0)

    _save_debug_screenshot(page, '06b_login_timeout')
    log.error(f'Login failed -- page URL after waiting: {page.url}')
    return False


def _is_logged_in(page) -> bool:
    """Return True if we're looking at an authenticated account page."""
    url = page.url.lower()
    if 'dashboard' in url or ('account' in url and 'logon' not in url and 'login' not in url):
        return True
    # Check for welcome text or account navigation
    try:
        if page.query_selector('[class*="welcome"], a[href*="logout"], a[href*="Logoff"]'):
            return True
    except Exception:
        pass
    return False



def _apply_invoice_date_filter(page, start_date: str, end_date: str, label: str) -> bool:
    """
    Open the FILTER panel on the invoices page and apply a custom date range.

    The filter panel contains a "Select Date Range" dropdown (<select>).
    Selecting a "Custom" option should reveal From/To date text inputs.

    start_date / end_date: 'MM/DD/YYYY'
    Returns True if any filter interaction succeeded.
    """
    # Click the FILTER button to open the drawer/popover
    filter_opened = False
    for sel in [
        'button:has-text("FILTER")', 'button:has-text("Filter")',
        'button[aria-label*="filter" i]',
    ]:
        try:
            btn = page.wait_for_selector(sel, timeout=5_000, state='visible')
            page.evaluate("el => el.click()", btn)
            time.sleep(1.2)   # wait for panel animation to complete
            filter_opened = True
            log.info(f"Opened FILTER panel via: {sel}")
            break
        except PlaywrightTimeout:
            continue

    if not filter_opened:
        log.warning("FILTER button not found — exporting unfiltered page")
        return False

    _save_debug_screenshot(page, f'filter_opened_{label}')

    # ── Inspect what the panel actually contains ──────────────────────────
    try:
        panel_info = page.evaluate("""
            () => ({
                selects: Array.from(document.querySelectorAll('select')).filter(
                    el => el.offsetParent !== null
                ).map(s => ({
                    id: s.id, name: s.name, value: s.value,
                    options: Array.from(s.options).map(o => ({v: o.value, t: o.text}))
                })),
                inputs: Array.from(document.querySelectorAll('input')).filter(
                    el => el.offsetParent !== null
                        && el.type !== 'checkbox' && el.type !== 'radio'
                        && el.type !== 'hidden'
                ).map(i => ({id: i.id, name: i.name, placeholder: i.placeholder, type: i.type}))
            })
        """)
        log.info(f"[FILTER panel] Visible selects: {panel_info['selects']}")
        log.info(f"[FILTER panel] Visible inputs:  {panel_info['inputs']}")
    except Exception as e:
        log.warning(f"Filter panel inspection failed: {e}")

    # ── Interact with the "Select Date Range" dropdown ────────────────────
    # The panel has a <select> (or custom dropdown) for date range.
    # We need to pick a "Custom" option to reveal date inputs.
    date_range_set   = False
    custom_selected  = False

    try:
        all_selects = page.query_selector_all('select')
        visible_selects = [s for s in all_selects
                          if page.evaluate("el => el.offsetParent !== null", s)]

        if visible_selects:
            target_sel = visible_selects[0]   # first visible <select> = Date Range
            opts = page.evaluate(
                "el => Array.from(el.options).map(o => ({v: o.value, t: o.text}))",
                target_sel
            )
            log.info(f"Date range select options: {opts}")

            # Try to find a "Custom" option (case-insensitive)
            custom_val = None
            for opt in opts:
                t_lo = opt.get('t', '').lower()
                v_lo = opt.get('v', '').lower()
                if 'custom' in t_lo or 'custom' in v_lo:
                    custom_val = opt.get('v') or opt.get('t')
                    break

            if custom_val is not None:
                target_sel.select_option(value=custom_val)
                time.sleep(0.8)   # wait for date input fields to appear
                custom_selected = True
                date_range_set  = True
                log.info(f"Selected date range option: '{custom_val}'")
            else:
                log.warning(f"No 'Custom' option found in date range select. Options: {opts}")
                # Log so we can see what IS available and fix on next run
        else:
            log.warning("No visible <select> found in FILTER panel")
    except Exception as e:
        log.warning(f"Date range select interaction failed: {e}")

    # ── Fill From / To date inputs (appear after selecting Custom) ─────────
    if custom_selected:
        # FROM date
        from_filled = False
        for sel in [
            'input[placeholder*="from" i]', 'input[placeholder*="start" i]',
            'input[id*="from" i]',           'input[id*="start" i]',
            'input[name*="from" i]',         'input[name*="start" i]',
            'input[type="date"]',
        ]:
            try:
                inp = page.wait_for_selector(sel, timeout=2_000, state='visible')
                page.evaluate("el => { el.value = ''; }", inp)
                inp.click()
                inp.type(start_date, delay=40)
                log.info(f"Set from-date: {start_date} via {sel}")
                from_filled = True
                break
            except PlaywrightTimeout:
                continue
        if not from_filled:
            log.warning(f"Could not fill from-date ({start_date}) — no matching input found")

        # TO date
        to_filled = False
        for sel in [
            'input[placeholder*="to" i]',  'input[placeholder*="end" i]',
            'input[id*="to" i]',           'input[id*="end" i]',
            'input[name*="to" i]',         'input[name*="end" i]',
        ]:
            try:
                inp = page.wait_for_selector(sel, timeout=2_000, state='visible')
                page.evaluate("el => { el.value = ''; }", inp)
                inp.click()
                inp.type(end_date, delay=40)
                log.info(f"Set to-date: {end_date} via {sel}")
                to_filled = True
                break
            except PlaywrightTimeout:
                continue
        if not to_filled:
            log.warning(f"Could not fill to-date ({end_date}) — no matching input found")

    # ── Apply the filter ──────────────────────────────────────────────────
    # Use scoped selectors first to avoid accidentally clicking the global search bar.
    applied = False
    scope_parents = [
        '[class*="filter"]', '[class*="drawer"]', '[class*="popover"]',
        '[class*="panel"]',  '[class*="modal"]',
    ]
    apply_labels = [
        'button:has-text("Apply")',  'button:has-text("APPLY")',
        'button:has-text("Done")',   'button:has-text("DONE")',
    ]

    for parent in scope_parents:
        for btn_sel in apply_labels:
            try:
                btn = page.wait_for_selector(
                    f'{parent} {btn_sel}', timeout=1_500, state='visible'
                )
                page.evaluate("el => el.click()", btn)
                applied = True
                log.info(f"Applied filter via: {parent} > {btn_sel}")
                break
            except PlaywrightTimeout:
                continue
        if applied:
            break

    # Fallback: any visible Apply / Done button
    if not applied:
        for sel in apply_labels:
            try:
                btn = page.wait_for_selector(sel, timeout=2_000, state='visible')
                page.evaluate("el => el.click()", btn)
                applied = True
                log.info(f"Applied filter (global): {sel}")
                break
            except PlaywrightTimeout:
                continue

    if not applied:
        page.keyboard.press('Escape')
        log.warning("No Apply button found — pressed Escape to close FILTER panel")

    # Wait for table to reload
    try:
        page.wait_for_load_state('networkidle', timeout=15_000)
    except PlaywrightTimeout:
        time.sleep(2.0)

    _save_debug_screenshot(page, f'filter_applied_{label}')
    return applied or date_range_set


def _download_invoices_csv(page, download_dir: Path) -> Path | None:
    """
    Download ALL invoice history by iterating year-by-year (2024 → current year).

    The SW PRO+ portal hard-caps results at 500 records per request.
    Without date filtering, only the most-recent ~500 invoices are visible.
    By fetching one year at a time we work around that cap.

    Each year: load the Invoices page → apply FILTER for that year's date range
    → paginate through all pages → collect CSV rows.
    Final merged CSV is written to download_dir/sw_invoices_raw.csv.
    """
    current_year = datetime.date.today().year
    all_rows:    list[str] = []
    header_line: str | None = None

    for year in range(2024, current_year + 1):
        start_date = f'01/01/{year}'
        end_date   = (f'12/31/{year}'
                      if year < current_year
                      else datetime.date.today().strftime('%m/%d/%Y'))

        log.info(f"── Fetching invoices for {year}  ({start_date} → {end_date}) ──")

        # Fresh page load for each year so the filter starts clean
        try:
            page.goto(SW_INVOICES_URL, wait_until='domcontentloaded', timeout=25_000)
            page.wait_for_load_state('networkidle', timeout=15_000)
        except PlaywrightTimeout:
            log.warning(f"Timeout loading Invoices page for {year} — continuing anyway")

        _save_debug_screenshot(page, f'inv_{year}_page')

        # Apply the date filter for this year
        _apply_invoice_date_filter(page, start_date, end_date, str(year))
        _save_debug_screenshot(page, f'inv_{year}_filtered')

        # Quick sanity check: how many rows does the table show?
        try:
            row_count = page.evaluate(
                "() => document.querySelectorAll('table tbody tr').length"
            )
            log.info(f"Year {year}: {row_count} table row(s) visible after filter")
            if row_count == 0:
                log.info(f"Year {year}: no invoices found — skipping CSV download")
                continue
        except Exception:
            pass  # non-fatal; proceed to download anyway

        # ── Paginate and download CSVs for this year ──────────────────────
        page_num = 0
        while True:
            page_num += 1
            log.info(f"Year {year}, page {page_num} — selecting all & exporting CSV...")

            # Click "Select All" checkbox
            for sel in [
                '#table-toolbar input[type="checkbox"]',
                'input[type="checkbox"][aria-label*="all" i]',
                'th input[type="checkbox"]',
                'thead input[type="checkbox"]',
            ]:
                try:
                    cb = page.wait_for_selector(sel, timeout=4_000, state='visible')
                    page.evaluate("el => el.click()", cb)
                    time.sleep(0.5)
                    log.info(f"Clicked select-all: {sel}")
                    break
                except PlaywrightTimeout:
                    continue

            # Find CSV export button
            export_el = None
            for sel in ['button:has-text("CSV")', 'a:has-text("CSV")']:
                try:
                    export_el = page.wait_for_selector(sel, timeout=4_000, state='visible')
                    log.info(f"Found export button: {sel}")
                    break
                except PlaywrightTimeout:
                    continue

            if not export_el:
                log.error(f"Year {year} p{page_num}: CSV export button not found")
                break

            try:
                dest = download_dir / f'sw_invoices_{year}_p{page_num}.csv'
                with page.expect_download(timeout=25_000) as dl_info:
                    page.evaluate("el => el.click()", export_el)
                dl_info.value.save_as(str(dest))
                size = dest.stat().st_size
                log.info(f"Downloaded: {dest.name} ({size} bytes)")

                if size == 0:
                    log.info(f"Year {year} p{page_num}: empty CSV — no more records")
                    break

                with open(dest, newline='', encoding='utf-8-sig') as f:
                    lines = f.read().splitlines()

                if not lines:
                    break

                if header_line is None:
                    header_line = lines[0]
                    all_rows.extend(lines[1:])
                else:
                    all_rows.extend(lines[1:] if lines[0] == header_line else lines)

                log.info(f"Year {year} p{page_num}: {len(lines) - 1} data rows collected")

            except Exception as e:
                log.error(f"Year {year} p{page_num}: download failed: {e}")
                _save_debug_screenshot(page, f'dl_error_{year}_p{page_num}')
                break

            # Navigate to next page (if any)
            next_found = False
            for sel in [
                'button[aria-label*="Next" i]:not([disabled])',
                'button:has-text("Next"):not([disabled])',
                'a[aria-label*="Next" i]',
            ]:
                try:
                    nxt = page.wait_for_selector(sel, timeout=3_000, state='visible')
                    page.evaluate("el => el.click()", nxt)
                    try:
                        page.wait_for_load_state('networkidle', timeout=15_000)
                    except PlaywrightTimeout:
                        time.sleep(1.0)
                    next_found = True
                    log.info(f"Navigated to year {year} page {page_num + 1}")
                    break
                except PlaywrightTimeout:
                    continue

            if not next_found:
                log.info(f"Year {year}: last invoice page was {page_num}")
                break

    if not all_rows or header_line is None:
        log.error("No invoice data collected across any year")
        return None

    # Write final merged CSV
    merged = download_dir / 'sw_invoices_raw.csv'
    with open(merged, 'w', newline='', encoding='utf-8') as f:
        f.write(header_line + '\n')
        f.write('\n'.join(all_rows))
    log.info(f"Merged invoices → {merged.name}  ({len(all_rows)} total data rows)")
    return merged


def _scrape_payment_history(page) -> list[dict]:
    """
    Navigate to Payment History via the PRO+ dashboard Payments tile,
    then extract payment records from the table.
    """
    log.info("Loading Payment History page...")
    # The /PaymentHistoryView URL redirects to dashboard — navigate via the tile instead
    try:
        page.goto(SW_ACCOUNT_URL, wait_until='domcontentloaded', timeout=25_000)
        page.wait_for_load_state('networkidle', timeout=15_000)
    except PlaywrightTimeout:
        pass

    # Click the "Payments" tile on the dashboard
    payments_link = None
    for sel in ['a:has-text("Payments")', '[href*="payment" i]', '[href*="Payment"]']:
        try:
            payments_link = page.wait_for_selector(sel, timeout=5_000, state='visible')
            log.info(f"Found Payments link: {sel}")
            break
        except PlaywrightTimeout:
            continue

    if payments_link:
        payments_link.click()
        try:
            page.wait_for_load_state('networkidle', timeout=20_000)
        except PlaywrightTimeout:
            pass
        log.info(f"Navigated to: {page.url}")
    else:
        log.warning("Could not find Payments tile — trying direct URL")
        try:
            page.goto(SW_PAYMENTS_URL, wait_until='domcontentloaded', timeout=25_000)
        except PlaywrightTimeout:
            pass

    _save_debug_screenshot(page, '08_payments_page')

    # Set date filter to ALL TIME to capture full payment history
    try:
        date_sel = None
        for sel in [
            'select[name*="date" i]', 'select[id*="date" i]',
            'select[name*="period" i]', 'select[name*="range" i]',
            'select',   # fallback: first visible select on the page
        ]:
            try:
                el = page.wait_for_selector(sel, timeout=3_000, state='visible')
                date_sel = el
                break
            except PlaywrightTimeout:
                continue

        if date_sel:
            # Always log the available options — critical for debugging
            try:
                opts = page.evaluate(
                    "el => Array.from(el.options).map(o => ({v: o.value, t: o.text}))",
                    date_sel
                )
                log.info(f"Payment date filter options: {opts}")
            except Exception as e:
                log.warning(f"Could not read payment date filter options: {e}")
                opts = []

            # Try to select the widest / all-time option available
            # Priority: labels first (more stable), then common values
            all_time_labels  = ['All Time', 'All Dates', 'All', 'All History', 'Since Beginning']
            all_time_values  = ['allTime', 'all_time', 'all', 'ALL', '0', 'ALLTIME', 'allDates']
            set_filter = False

            for label_val in all_time_labels:
                try:
                    date_sel.select_option(label=label_val)
                    log.info(f"Set payment date filter (all-time) by label: '{label_val}'")
                    set_filter = True
                    break
                except Exception:
                    continue

            if not set_filter:
                for val in all_time_values:
                    try:
                        date_sel.select_option(value=val)
                        log.info(f"Set payment date filter (all-time) by value: '{val}'")
                        set_filter = True
                        break
                    except Exception:
                        continue

            if not set_filter:
                # Pick the option with the highest numeric value (usually means "All")
                # or just use whichever option covers the broadest range
                try:
                    best_opt = None
                    for opt in opts:
                        t_lo = opt.get('t', '').lower()
                        if 'all' in t_lo or 'history' in t_lo or 'ever' in t_lo:
                            best_opt = opt
                            break
                    if best_opt:
                        date_sel.select_option(value=best_opt['v'])
                        log.info(f"Set payment date filter by keyword match: {best_opt}")
                        set_filter = True
                except Exception:
                    pass

            if not set_filter:
                log.warning(
                    "Could not find an all-time payment filter option. "
                    f"Available options: {opts}"
                )

            # Click Search to apply the filter
            for sel in [
                'button:has-text("Search")', 'input[value="Search"]',
                'button[type="submit"]',     'a:has-text("Search")',
            ]:
                try:
                    page.click(sel, timeout=3_000)
                    try:
                        page.wait_for_load_state('networkidle', timeout=10_000)
                    except PlaywrightTimeout:
                        time.sleep(1.5)
                    log.info(f"Clicked search: {sel}")
                    break
                except PlaywrightTimeout:
                    continue
        else:
            log.warning("No date filter <select> found on payments page")
    except Exception as e:
        log.warning(f"Payment date filter setup failed: {e}")

    _save_debug_screenshot(page, '09_payments_filtered')

    # Try CSV download first (confirmed present on this page)
    payments = []
    csv_downloaded = False
    try:
        csv_el = page.wait_for_selector(
            'button:has-text("CSV"), a:has-text("CSV")', timeout=5_000, state='visible'
        )
        if csv_el:
            log.info("Downloading payments CSV...")
            with page.expect_download(timeout=20_000) as dl_info:
                page.evaluate("el => el.click()", csv_el)
            download = dl_info.value
            dest = DOWNLOAD_DIR / 'sw_payments_raw.csv'
            download.save_as(str(dest))
            log.info(f"Payments CSV downloaded: {dest.name}  ({dest.stat().st_size} bytes)")
            # Parse the CSV
            payments = _parse_payments_csv(dest)
            csv_downloaded = True
    except Exception as e:
        log.warning(f"Payments CSV download failed: {e} — falling back to table scrape")

    if not csv_downloaded:
        # Fallback: scrape the HTML table
        try:
            rows = page.evaluate("""
                () => {
                    const rows = [];
                    document.querySelectorAll('table tr').forEach(tr => {
                        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
                        if (cells.length >= 2) rows.push(cells);
                    });
                    return rows;
                }
            """)
            log.info(f"Found {len(rows)} table rows on payments page")
            for cells in rows:
                first = cells[0].lower()
                if first in ('date', 'payment date', 'trans date', ''):
                    continue
                if not any(c.isdigit() for c in cells[0]):
                    continue
                payments.append({
                    'date':        cells[0],
                    'description': cells[1] if len(cells) > 1 else '',
                    'amount':      cells[2] if len(cells) > 2 else '',
                    'reference':   cells[3] if len(cells) > 3 else '',
                })
        except Exception as e:
            log.error(f"Payment table extraction failed: {e}")

    log.info(f"Extracted {len(payments)} payment records")
    return payments


def _parse_payments_csv(csv_path: Path) -> list[dict]:
    """
    Parse downloaded payments CSV from SW PRO+ portal.

    Actual columns (confirmed):
      Payment Date, Job Name, Job #, Ref Number, Payment Location, Amount

    Amounts are in accounting notation: ($1,845.00) → 1845.00
    Ref Number is the unique payment reference (used for dedup in Sheets).
    """
    records = []
    try:
        with open(csv_path, newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                norm = {k.strip(): v.strip() for k, v in row.items() if k}

                date     = norm.get('Payment Date', '')
                desc     = norm.get('Job Name', '')
                job_num  = norm.get('Job #', '')
                ref_num  = norm.get('Ref Number', '')
                location = norm.get('Payment Location', '')
                amount   = norm.get('Amount', '').replace('$', '').replace(',', '').strip()

                # Strip accounting parentheses: ($1,845.00) or (1845.00) → 1845.00
                if amount.startswith('(') and amount.endswith(')'):
                    amount = amount[1:-1]

                if date and amount:
                    records.append({
                        'date':        date,
                        'description': desc,
                        'job_num':     job_num,
                        'ref_number':  ref_num,   # unique ID — used for dedup
                        'location':    location,
                        'amount':      amount,
                    })
    except Exception as e:
        log.error(f"Failed to parse payments CSV: {e}")

    log.info(f"Parsed {len(records)} payment records from CSV")
    return records


def _parse_invoice_csv(csv_path: Path) -> list[dict]:
    """
    Parse the SW invoices CSV export.

    The portal exports one row per line item (each product/paint can).
    Invoice-level fields (Order Number, Order Date, Order Total, PO Number)
    appear only on the FIRST row of each invoice group; subsequent rows for
    the same invoice have those fields blank.

    Actual columns (confirmed from downloaded CSV):
      Order Number, Invoice Number, PO Number, Order Date, Order Total, Taxes,
      Account Number, Job Number, Job Name, Store Number, Type, Unit Number,
      SKU, Product/REX Number, Product Name, Quantity, Price, Color Name

    We deduplicate to one record per unique Invoice Number.
    """
    seen: dict = {}   # inv_num -> record dict

    try:
        with open(csv_path, newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                norm = {k.strip(): v.strip() for k, v in row.items() if k}

                inv_num = norm.get('Invoice Number', '').strip()
                if not inv_num:
                    continue

                if inv_num not in seen:
                    date   = norm.get('Order Date', '')
                    subtotal = norm.get('Order Total', '').replace('$', '').replace(',', '').strip()
                    taxes    = norm.get('Taxes', '').replace('$', '').replace(',', '').strip()
                    # Total billed = Order Total + Taxes (they are separate columns)
                    try:
                        amount = str(round(float(subtotal or 0) + float(taxes or 0), 2))
                    except ValueError:
                        amount = subtotal  # fall back to pre-tax if parse fails
                    po_num = norm.get('PO Number', '')
                    job    = norm.get('Job Name', '')
                    order  = norm.get('Order Number', '')
                    # Use PO Number as primary description; fall back to Job Name
                    desc = po_num if po_num else job

                    seen[inv_num] = {
                        'date'       : date,
                        'description': desc,
                        'inv_num'    : inv_num,
                        'order_num'  : order,
                        'po_num'     : po_num,
                        'job_name'   : job,
                        'amount'     : amount,
                        'entry_type' : 'purchase',
                    }
                else:
                    # Fill in blanks from later rows (guards edge cases)
                    rec = seen[inv_num]
                    if not rec['date'] and norm.get('Order Date'):
                        rec['date'] = norm['Order Date']
                    if not rec['amount'] and norm.get('Order Total'):
                        subtotal = norm['Order Total'].replace('$', '').replace(',', '').strip()
                        taxes    = norm.get('Taxes', '').replace('$', '').replace(',', '').strip()
                        try:
                            rec['amount'] = str(round(float(subtotal or 0) + float(taxes or 0), 2))
                        except ValueError:
                            rec['amount'] = subtotal
                    if not rec['description'] and norm.get('PO Number'):
                        rec['description'] = norm['PO Number']

    except Exception as e:
        log.error(f"Failed to parse invoice CSV: {e}")

    records = list(seen.values())
    log.info(f"Parsed {len(records)} invoice records")
    return records


def _write_invoices_staging(records: list[dict]):
    with open(OUT_INVOICES, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['date', 'inv_num', 'order_num', 'po_num', 'job_name', 'description', 'amount', 'entry_type'])
        for r in records:
            w.writerow([
                r.get('date', ''),
                r.get('inv_num', ''),
                r.get('order_num', ''),
                r.get('po_num', ''),
                r.get('job_name', ''),
                r.get('description', ''),
                r.get('amount', ''),
                r.get('entry_type', 'purchase'),
            ])
    log.info(f"Wrote {len(records)} records → {OUT_INVOICES.name}")


def _write_payments_staging(payments: list[dict]):
    with open(OUT_PAYMENTS, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['date', 'description', 'job_num', 'ref_number', 'location', 'amount', 'entry_type'])
        for p in payments:
            w.writerow([
                p.get('date', ''),
                p.get('description', ''),
                p.get('job_num', ''),
                p.get('ref_number', ''),
                p.get('location', ''),
                p.get('amount', ''),
                'payment',
            ])
    log.info(f"Wrote {len(payments)} records → {OUT_PAYMENTS.name}")


def _push_to_sheets(invoice_records: list[dict], payment_records: list[dict]):
    """
    Push SW invoice and payment records to the 'SW Credit Account' tab.

    Uses Google OAuth 2.0 Desktop flow:
      • Set GOOGLE_CREDENTIALS_JSON to oauth_client_secret.json
      • First run opens a browser once for Google sign-in → saves token.json
      • GitHub Actions: token.json is written from the GOOGLE_TOKEN_JSON secret
      • Subsequent runs auto-refresh silently (no browser needed)

    Dedup IDs (col E):
      Invoices  → "SW-INV-{inv_num}"
      Payments  → "SW-PAY-{ref_num}"

    Sheet columns: A: Date  B: Description  C: Job/PO  D: Amount  E: Receipt #  F: Notes

    .env keys required:
      SPREADSHEET_ID           — from the Sheets URL
      GOOGLE_CREDENTIALS_JSON  — path to oauth_client_secret.json
    """
    spreadsheet_id = os.getenv('SPREADSHEET_ID', '').strip()
    if not spreadsheet_id:
        log.info("SPREADSHEET_ID not set in .env — skipping Google Sheets push")
        return 0, 0

    creds_path = Path(os.getenv(
        'GOOGLE_CREDENTIALS_JSON',
        str(SCRIPT_DIR / 'oauth_client_secret.json')
    ))
    token_path = SCRIPT_DIR / 'token.json'

    if not creds_path.exists():
        log.warning(f"Google credentials not found: {creds_path} — skipping Sheets push")
        return 0, 0

    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build
    except ImportError:
        log.warning("Missing Google libraries — skipping Sheets push")
        log.warning("Run: pip install google-api-python-client google-auth google-auth-oauthlib")
        return 0, 0

    SHEET  = 'SW Credit Account'
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

    try:
        creds = None

        # ── Load token.json (cached OAuth token) ──────────────────────────
        # In GitHub Actions, token.json is written from the GOOGLE_TOKEN_JSON secret
        # before this script runs — no browser is ever needed in CI.
        if token_path.exists():
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
            log.info(f"Loaded Google OAuth token from {token_path.name}")

        # ── Refresh silently if expired, or do first-time browser login ───
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
                log.info("Google OAuth token refreshed silently")
            else:
                # First-time local setup only — opens browser once to authorize
                log.info("First-run Google auth — opening browser for one-time sign-in...")
                flow = InstalledAppFlow.from_client_secrets_file(str(creds_path), SCOPES)
                creds = flow.run_local_server(port=0)
                log.info("Google sign-in complete")

            # Save refreshed/new token for next run
            with open(token_path, 'w') as tf:
                tf.write(creds.to_json())
            log.info(f"Google token saved → {token_path.name}")

        service = build('sheets', 'v4', credentials=creds)
        api     = service.spreadsheets()

        # ── Read existing sheet data (cols A–G) ───────────────────────────
        result = api.values().get(
            spreadsheetId=spreadsheet_id,
            range=f"'{SHEET}'!A:G"
        ).execute()
        rows = result.get('values', [])

        # Collect dedup IDs from col E and locate section header rows
        existing_ids      = set()
        purchases_hdr_row = None    # 1-indexed sheet row of PURCHASES / CHARGES header
        payments_hdr_row  = None    # 1-indexed sheet row of PAYMENTS header

        for i, row in enumerate(rows):
            sheet_row = i + 1
            col_a = str(row[0]).strip().upper() if row else ''
            col_e = str(row[4]).strip()         if len(row) > 4 else ''
            if col_e:
                existing_ids.add(col_e)
            if ('PURCHASE' in col_a or 'CHARGE' in col_a) and purchases_hdr_row is None:
                purchases_hdr_row = sheet_row
            if 'PAYMENT' in col_a and purchases_hdr_row and payments_hdr_row is None:
                payments_hdr_row = sheet_row

        log.info(
            f"Sheets: PURCHASES hdr @ row {purchases_hdr_row}, "
            f"PAYMENTS hdr @ row {payments_hdr_row}, "
            f"{len(existing_ids)} existing dedup ID(s)"
        )

        # ── Build rows to write ────────────────────────────────────────────
        new_invoice_rows = []
        for rec in invoice_records:
            dedup_id = f"SW-INV-{rec['inv_num']}"
            if dedup_id in existing_ids:
                continue
            desc = f"INV#{rec['inv_num']}"
            if rec.get('po_num'):
                desc += f" – {rec['po_num']}"
            new_invoice_rows.append([
                rec['date'],
                desc,
                rec.get('po_num', ''),
                float(rec['amount']) if rec.get('amount') else '',
                dedup_id,
                rec.get('order_num', ''),
                'Invoice',
            ])

        new_payment_rows = []
        for pay in payment_records:
            ref      = pay.get('ref_number', '')
            dedup_id = f"SW-PAY-{ref}" if ref else ''
            if dedup_id and dedup_id in existing_ids:
                continue
            new_payment_rows.append([
                pay.get('date', ''),
                pay.get('description', ''),
                pay.get('job_num', ''),
                float(pay['amount']) if pay.get('amount') else '',
                dedup_id,
                pay.get('location', ''),
                'Payment',
            ])

        # ── Find insert rows for each section ─────────────────────────────
        def _last_data_row(start_row: int, end_row: int) -> int:
            """Last 1-indexed sheet row with content in range [start_row, end_row]."""
            last = start_row - 1
            for i in range(start_row - 1, min(end_row, len(rows))):
                if any(str(c).strip() for c in rows[i]):
                    last = i + 1
            return last

        updates = []

        # Base "next empty row" = one past the last row that has any content
        next_empty = _last_data_row(1, len(rows)) + 1

        if new_invoice_rows:
            if purchases_hdr_row:
                # Structured sheet: insert after last invoice row in the section
                data_start  = purchases_hdr_row + 2
                section_end = (payments_hdr_row - 1) if payments_hdr_row else len(rows)
                insert_at   = _last_data_row(data_start, section_end) + 1
            else:
                # No section header found — append after all existing data
                log.warning(
                    "No 'PURCHASES'/'CHARGES' row found in col A — "
                    "appending invoices at row %d (add a 'PURCHASES' row to use section mode)",
                    next_empty,
                )
                insert_at = next_empty
            rng = f"'{SHEET}'!A{insert_at}:G{insert_at + len(new_invoice_rows) - 1}"
            updates.append({'range': rng, 'values': new_invoice_rows})
            log.info(f"Queued {len(new_invoice_rows)} invoice row(s) → Sheet row {insert_at}")
            # Advance the "next empty" pointer for payments
            next_empty = insert_at + len(new_invoice_rows)

        if new_payment_rows:
            if payments_hdr_row:
                pay_start = payments_hdr_row + 2
                insert_at = _last_data_row(pay_start, len(rows)) + 1
            else:
                log.warning(
                    "No 'PAYMENTS' row found in col A — "
                    "appending payments at row %d (add a 'PAYMENTS' row to use section mode)",
                    next_empty,
                )
                insert_at = next_empty
            rng = f"'{SHEET}'!A{insert_at}:G{insert_at + len(new_payment_rows) - 1}"
            updates.append({'range': rng, 'values': new_payment_rows})
            log.info(f"Queued {len(new_payment_rows)} payment row(s) → Sheet row {insert_at}")

        # ── Execute batch update ──────────────────────────────────────────
        if updates:
            api.values().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body={'valueInputOption': 'USER_ENTERED', 'data': updates}
            ).execute()
            log.info(
                f"Sheets push complete: "
                f"{len(new_invoice_rows)} invoice(s), {len(new_payment_rows)} payment(s) added"
            )
        elif not new_invoice_rows and not new_payment_rows:
            log.info("Sheets push: no new records (all already present or deduped)")

        return len(new_invoice_rows), len(new_payment_rows)

    except Exception as e:
        log.error(f"Google Sheets push failed: {e}", exc_info=True)
        return 0, 0


def main():
    if not SW_EMAIL:
        msg = "SWILLIAMS_EMAIL not found in .env"
        log.error(msg); print(f"ERROR: {msg}"); sys.exit(1)
    if not SW_PASSWORD:
        msg = "SWILLIAMS_PW not found in .env"
        log.error(msg); print(f"ERROR: {msg}"); sys.exit(1)

    log.info("── SW Sync started ───────────────────────────────────")
    DOWNLOAD_DIR.mkdir(exist_ok=True)

    invoice_records = []
    payment_records = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            downloads_path=str(DOWNLOAD_DIR),
            args=['--disable-blink-features=AutomationControlled'],
        )
        context = browser.new_context(
            accept_downloads=True,
            viewport={'width': 1280, 'height': 900},
            user_agent=(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/124.0.0.0 Safari/537.36'
            ),
        )
        page = context.new_page()

        try:
            if not _login(page):
                log.error("Login failed — aborting. Check debug_*.png files for details.")
                print("0")
                return

            csv_path = _download_invoices_csv(page, DOWNLOAD_DIR)
            if csv_path and csv_path.exists():
                invoice_records = _parse_invoice_csv(csv_path)

            payment_records = _scrape_payment_history(page)

        except Exception as e:
            log.error(f"Unexpected error: {e}", exc_info=True)
        finally:
            context.close()
            browser.close()

    _write_invoices_staging(invoice_records)
    _write_payments_staging(payment_records)

    # ── Push to Google Sheets (runs only if SPREADSHEET_ID + credentials are set) ──
    pushed_inv, pushed_pay = _push_to_sheets(invoice_records, payment_records)

    total = len(invoice_records) + len(payment_records)
    log.info(
        f"── Sync complete: {len(invoice_records)} invoices, {len(payment_records)} payments  "
        f"({pushed_inv} inv + {pushed_pay} pay pushed to Sheets) ──"
    )
    print(total)


if __name__ == '__main__':
    main()
