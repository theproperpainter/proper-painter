import { jwtVerify } from 'jose'

// No 'server-only' here and no next/headers import — this file is shared between
// Server Components/Actions (via session.ts, using next/headers cookies()) and
// src/proxy.ts (which reads request.cookies directly, a different API). Keeping
// the JWT verification logic in one place avoids the two ever drifting apart.

export const DASHBOARD_SESSION_COOKIE = 'dashboard_session'

function encodedSecret() {
  const secret = process.env.DASHBOARD_SESSION_SECRET
  if (!secret) throw new Error('Missing required env var: DASHBOARD_SESSION_SECRET')
  return new TextEncoder().encode(secret)
}

/** True if `token` is a currently-valid, correctly-signed session token. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    await jwtVerify(token, encodedSecret(), { algorithms: ['HS256'] })
    return true
  } catch {
    return false // expired, tampered, or signed with an old secret
  }
}
