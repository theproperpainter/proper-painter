'use client'

import { useActionState } from 'react'
import { login } from './actions'

const fieldClass =
  'mt-1 w-full border-b border-gray-800 bg-transparent py-2 text-foreground placeholder:text-gray-600 focus:border-foreground focus:outline-none transition-colors'

const labelClass = 'block text-sm text-gray-500'

export default function DashboardLoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="mx-auto flex max-w-sm flex-col px-6 py-24">
      <h1 className="text-2xl font-light tracking-tight">Proper Painter Dashboard</h1>
      <p className="mt-3 text-sm text-gray-400">Internal use only. Enter the password to continue.</p>

      <form action={action} className="mt-10 space-y-6">
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            className={fieldClass}
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-sm text-gray-300">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-block w-full border border-foreground px-8 py-3 text-sm tracking-wide transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
        >
          {pending ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
