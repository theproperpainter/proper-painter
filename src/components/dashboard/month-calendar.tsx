import Link from 'next/link'
import { buildMonthGrid, monthLabel, shiftMonth, jobsOnDay } from '@/lib/dashboard/calendar-utils'
import { hasRealDripJobsId, dripJobsUrl, type ScheduledJob } from '@/lib/dashboard/jobs'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function navHref(year: number, month: number): string {
  return `/dashboard?year=${year}&month=${month + 1}`
}

export default function MonthCalendar({
  year,
  month,
  jobs,
  today,
}: {
  year: number
  month: number
  jobs: ScheduledJob[]
  today: Date
}) {
  const weeks = buildMonthGrid(year, month)
  const prev = shiftMonth(year, month, -1)
  const next = shiftMonth(year, month, 1)

  return (
    <div>
      <div className="flex items-center justify-between text-[var(--cal-text)]">
        <Link
          href={navHref(prev.year, prev.month)}
          className="text-sm text-[var(--cal-muted)] hover:text-[var(--cal-text)]"
        >
          ← {monthLabel(prev.year, prev.month)}
        </Link>
        <h2 className="text-xl font-light tracking-tight text-[var(--cal-text)]">{monthLabel(year, month)}</h2>
        <Link
          href={navHref(next.year, next.month)}
          className="text-sm text-[var(--cal-muted)] hover:text-[var(--cal-text)]"
        >
          {monthLabel(next.year, next.month)} →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden border border-[var(--cal-border)] bg-[var(--cal-border)] text-xs">
        {DAY_LABELS.map((d) => (
          <div key={d} className="bg-[var(--cal-bg)] px-2 py-1 text-center text-[var(--cal-muted)]">
            {d}
          </div>
        ))}

        {weeks.flatMap((week, wi) =>
          week.map(({ date, inMonth }, di) => {
            const dayJobs = jobsOnDay(jobs, date)
            const isToday =
              date.getFullYear() === today.getFullYear() &&
              date.getMonth() === today.getMonth() &&
              date.getDate() === today.getDate()

            return (
              <div
                key={`${wi}-${di}`}
                className={`min-h-24 p-1.5 ${isToday ? 'bg-[var(--cal-today-tint)]' : 'bg-[var(--cal-bg)]'} ${inMonth ? '' : 'opacity-40'}`}
              >
                <div
                  className={`text-right ${isToday ? 'font-medium text-[var(--cal-text)]' : 'text-[var(--cal-muted)]'}`}
                >
                  {date.getDate()}
                </div>
                <div className="mt-1 space-y-0.5">
                  {dayJobs.map((job) => {
                    // Fixed colors + a visible border, regardless of the chosen card theme —
                    // the user can pick any background, including one that happens to match
                    // this chip color, so a border (not just a color difference) keeps chips
                    // legible as distinct boxes no matter what.
                    const chipClass =
                      'block truncate rounded-sm border border-gray-400 bg-gray-100 px-1 py-0.5 text-[11px] leading-tight text-gray-900 shadow-sm'
                    const label = job.crew ? `${job.name} — ${job.crew}` : job.name
                    const key = job.name + job.start.toISOString()

                    if (hasRealDripJobsId(job.dripJobsId)) {
                      return (
                        <a
                          key={key}
                          href={dripJobsUrl(job.dripJobsId)}
                          target="_blank"
                          rel="noreferrer"
                          title={`${label} — open in DripJobs`}
                          className={`${chipClass} hover:bg-white`}
                        >
                          {job.name}
                        </a>
                      )
                    }

                    return (
                      <div key={key} title={`${label} (not linked to a DripJobs ID)`} className={chipClass}>
                        {job.name}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
