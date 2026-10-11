import type { Metadata } from 'next'
import { hasValidSession } from '@/lib/dashboard/session'
import { redirect } from 'next/navigation'
import { logout } from './actions'

// Belt-and-suspenders: src/proxy.ts already gates every /dashboard/* request,
// but checking again here follows the Next.js auth guide's recommendation to put
// the real check close to the data/page itself, not only in Proxy.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardPage() {
  if (!(await hasValidSession())) {
    redirect('/dashboard/login')
  }

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
      <p className="mt-6 text-gray-400">
        Login and access are working. The cash and calendar views go here next.
      </p>
    </div>
  )
}
