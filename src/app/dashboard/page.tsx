import type { Metadata } from 'next'
import { hasValidSession } from '@/lib/dashboard/session'
import { getAvailableCash } from '@/lib/dashboard/cash'
import { getActiveJobs } from '@/lib/dashboard/jobs'
import MonthCalendar from '@/components/dashboard/month-calendar'
import { redirect } from 'next/navigation'
import { logout } from './actions'

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

// Belt-and-suspenders: src/proxy.ts already gates every /dashboard/* request,
// but checking again here follows the Next.js auth guide's recommendation to put
// the real check close to the data/page itself, not only in Proxy.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  if (!(await hasValidSession())) {
    redirect('/dashboard/login')
  }

  const today = new Date()
  const params = await searchParams
  // URL months are 1-indexed (human-friendly, ?month=10 for October) — convert
  // to the 0-indexed convention calendar-utils and Date itself use internally.
  const year = Number(params.year) || today.getFullYear()
  const monthParam = Number(params.month)
  const month = monthParam >= 1 && monthParam <= 12 ? monthParam - 1 : today.getMonth()

  const [cash, jobs] = await Promise.all([getAvailableCash(), getActiveJobs()])

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-light tracking-tight">Dashboard</h1>
        <form action={logout}>
          <button type="submit" className="text-sm text-gray-500 underline-offset-4 hover:underline">
            Log out
          </button>
        </form>
      </div>

      <div className="mt-12 border-b border-gray-800 pb-10">
        <p className="text-sm text-gray-500">Available Cash</p>
        <p className="mt-2 text-5xl font-light tracking-tight">{money(cash.availableCash)}</p>
        <p className="mt-2 text-xs text-gray-500">
          {cash.asOfDate ? `FNB balance as of ${cash.asOfDate}` : 'FNB balance (date unknown)'}
        </p>

        {cash.missingAccounts.length > 0 && (
          <p className="mt-4 text-sm text-gray-300" role="alert">
            ⚠ Could not read {cash.missingAccounts.join(', ')} — this total is missing that
            account and is understated.
          </p>
        )}

        <div className="mt-6 flex items-baseline justify-between border-t border-gray-800 pt-4 text-sm">
          <span className="text-gray-500">Owed to Sherwin-Williams</span>
          <span>{money(cash.swBalanceOwed)}</span>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        This is the raw bank balance, not reduced by what&rsquo;s owed above — payroll and the
        recurring bills list aren&rsquo;t wired in yet.
      </p>

      <MonthCalendar year={year} month={month} jobs={jobs} today={today} />
    </div>
  )
}
