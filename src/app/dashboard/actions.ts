'use server'

import { redirect } from 'next/navigation'
import { deleteSession } from '@/lib/dashboard/session'

export async function logout() {
  await deleteSession()
  redirect('/dashboard/login')
}
