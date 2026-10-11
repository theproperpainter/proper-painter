import type { ScheduledJob } from './jobs'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`
}

/** Jan=0..Dec=11, wrapping into the previous/next year correctly. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * A Sunday-start grid of weeks covering the full month, padded with the
 * trailing days of the previous/next month so every week has 7 days (same
 * convention as the old Schedule Calendar sheet). Cells outside the target
 * month are marked `inMonth: false` and shown dimmed, not hidden, so the
 * grid never has a ragged first/last row.
 */
export function buildMonthGrid(year: number, month: number): { date: Date; inMonth: boolean }[][] {
  const firstOfMonth = new Date(year, month, 1)
  const firstGridDay = new Date(year, month, 1 - firstOfMonth.getDay())

  const weeks: { date: Date; inMonth: boolean }[][] = []
  let cursor = firstGridDay
  // Stop once we've covered the month and completed its last week.
  while (weeks.length === 0 || weeks[weeks.length - 1][6].date.getMonth() === month) {
    const week: { date: Date; inMonth: boolean }[] = []
    for (let i = 0; i < 7; i++) {
      week.push({ date: cursor, inMonth: cursor.getMonth() === month })
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

/** Jobs whose [start, end] range includes this calendar day (inclusive both ends). */
export function jobsOnDay(jobs: ScheduledJob[], day: Date): ScheduledJob[] {
  const target = startOfDay(day).getTime()
  return jobs.filter((j) => startOfDay(j.start).getTime() <= target && startOfDay(j.end).getTime() >= target)
}

export { sameDay }
