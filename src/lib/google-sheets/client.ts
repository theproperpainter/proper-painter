import { google } from 'googleapis'

// Server-side only — never import this from a Client Component. Reuses the same
// OAuth credential as sw_sync.py (docs/Financial Workbook/PlaidSync/) rather than a
// service-account key, because this Google Cloud org has a policy blocking
// service-account key creation (iam.disableServiceAccountKeyCreation).

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    requireEnv('GOOGLE_SHEETS_CLIENT_ID'),
    requireEnv('GOOGLE_SHEETS_CLIENT_SECRET')
  )
  oauth2Client.setCredentials({ refresh_token: requireEnv('GOOGLE_SHEETS_REFRESH_TOKEN') })
  return oauth2Client
}

export const SPREADSHEET_ID = () => requireEnv('GOOGLE_SHEETS_SPREADSHEET_ID')

/** Reads one range (e.g. "Schedule Input!A1:L50") and returns raw cell values. */
export async function readRange(range: string): Promise<unknown[][]> {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID(),
    range,
  })
  return res.data.values ?? []
}

/** Reads several ranges in one API call — cheaper than multiple readRange() calls. */
export async function readRanges(ranges: string[]): Promise<Record<string, unknown[][]>> {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID(),
    ranges,
  })
  const out: Record<string, unknown[][]> = {}
  for (const vr of res.data.valueRanges ?? []) {
    if (vr.range) out[vr.range] = vr.values ?? []
  }
  return out
}
