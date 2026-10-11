import 'server-only'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { timingSafeEqual } from 'node:crypto'
import { DASHBOARD_SESSION_COOKIE, verifySessionToken } from './session-token'

// Internal cash/project dashboard — shared-password auth for a small, known
// audience (see docs/CASH_CALENDAR_DASHBOARD_PLAN.md). Not a general user
// accounts system: one shared password, one session cookie, no per-user identity.

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

/** Constant-time password check — avoids leaking info via response-time differences. */
export function verifyPassword(candidate: string): boolean {
  const expected = requireEnv('DASHBOARD_PASSWORD')
  const a = Buffer.from(candidate)
  const b = Buffer.from(expected)
  // Lengths must match for timingSafeEqual; a length mismatch is already a safe "no".
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function createSession(): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const secret = new TextEncoder().encode(requireEnv('DASHBOARD_SESSION_SECRET'))
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set(DASHBOARD_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(DASHBOARD_SESSION_COOKIE)
}

/** True if the current request carries a currently-valid session cookie. */
export async function hasValidSession(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifySessionToken(cookieStore.get(DASHBOARD_SESSION_COOKIE)?.value)
}
