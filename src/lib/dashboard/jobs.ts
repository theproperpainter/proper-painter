import 'server-only'
import { readRange } from '@/lib/google-sheets/client'

export interface ScheduledJob {
  name: string
  start: Date
  end: Date
  status: string
  crew: string
}

/** "6/29/2026" (the sheet's own m/d/yyyy format, as returned by the Sheets API's
 *  default FORMATTED_VALUE render) -> a local Date at midnight. Null if unparseable. */
function parseSheetDate(value: unknown): Date | null {
  const s = String(value ?? '').trim()
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return null
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]))
  return isNaN(d.getTime()) ? null : d
}

function isComplete(status: string): boolean {
  return /complete/i.test(status)
}

/**
 * All non-"Complete" jobs from Schedule Input that have a usable start date.
 * Mirrors the same "is this job done?" rule as autoAssignCalSlots in the Apps
 * Script, so the calendar and the spreadsheet never disagree about which jobs
 * are still active.
 */
export async function getActiveJobs(): Promise<ScheduledJob[]> {
  const rows = await readRange("'Schedule Input'!A2:H500")
  const jobs: ScheduledJob[] = []

  for (const row of rows) {
    const name = String(row[0] ?? '').trim()
    if (!name) continue

    const status = String(row[7] ?? '').trim()
    if (isComplete(status)) continue

    const start = parseSheetDate(row[1])
    if (!start) continue // can't place a job on the calendar with no start date

    const end = parseSheetDate(row[2]) ?? start
    jobs.push({
      name,
      start,
      end: end < start ? start : end,
      status,
      crew: String(row[3] ?? '').trim(),
    })
  }

  return jobs
}
