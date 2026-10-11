import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DASHBOARD_SESSION_COOKIE, verifySessionToken } from '@/lib/dashboard/session-token'

// Gates /dashboard/** behind the shared-password session (see
// src/lib/dashboard/session.ts). The login page itself must stay reachable, or
// nobody could ever sign in. This is an "optimistic" check — it only verifies the
// cookie's signature/expiry, same as the Next.js auth guide recommends for Proxy;
// there's nothing more sensitive to check against since there's no per-user DB.
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/dashboard/login') {
    return NextResponse.next()
  }

  const token = request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value
  const authed = await verifySessionToken(token)

  if (!authed) {
    const loginUrl = new URL('/dashboard/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
