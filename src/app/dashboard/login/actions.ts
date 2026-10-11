'use server'

import { redirect } from 'next/navigation'
import { verifyPassword, createSession } from '@/lib/dashboard/session'

export type LoginState = { error?: string } | undefined

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get('password') ?? '')

  if (!password || !verifyPassword(password)) {
    return { error: 'Incorrect password.' }
  }

  await createSession()
  redirect('/dashboard')
}
