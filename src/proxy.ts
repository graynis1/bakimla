import { auth } from './lib/auth'
import { NextResponse } from 'next/server'

const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/admin/login',
  '/search',
  '/pricing',
  '/booking',
  '/blog',
  '/kampanyalar',
  '/api/auth',
  '/api/debug-auth',
  '/api/setup-admin',
  '/api/blog',
  '/api/campaigns',
]

function isPublic(pathname: string) {
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true
  const SALON_PANEL_PATHS = [
    '/salon/dashboard', '/salon/profile', '/salon/employees', '/salon/services',
    '/salon/gallery', '/salon/calendar', '/salon/reviews', '/salon/subscription',
    '/salon/holidays', '/salon/settings',
  ]
  if (pathname.startsWith('/salon/') && !SALON_PANEL_PATHS.some((p) => pathname.startsWith(p))) {
    return true
  }
  if (pathname.startsWith('/api/businesses')) return true
  if (pathname.startsWith('/api/subscription-plans')) return true
  if (pathname.startsWith('/api/bank-accounts')) return true
  if (pathname.startsWith('/api/appointments/available-slots')) return true
  return false
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (isPublic(pathname)) return NextResponse.next()

  if (!session) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user?.role

  if (pathname.startsWith('/customer') && role !== 'CUSTOMER') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  if (pathname.startsWith('/salon/') && role !== 'SALON_OWNER') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
