'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Home, Search, CalendarDays, BookOpen, User, LogIn } from 'lucide-react'

const BASE_ITEMS = [
  { href: '/',         label: 'Ana Sayfa',  Icon: Home },
  { href: '/search',   label: 'Ara',        Icon: Search },
  { href: '/blog',     label: 'Blog',       Icon: BookOpen },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Don't render on admin and salon PANEL pages — they have their own sidebar nav.
  // /salon/[slug] is the public business profile — bottom nav should show there.
  const SALON_PANEL = [
    '/salon/dashboard', '/salon/calendar', '/salon/employees', '/salon/services',
    '/salon/reviews', '/salon/customers', '/salon/stats', '/salon/gallery',
    '/salon/profile', '/salon/holidays', '/salon/subscription', '/salon/settings',
  ]
  if (
    pathname.startsWith('/admin') ||
    SALON_PANEL.some(p => pathname.startsWith(p))
  ) return null

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const appointmentsHref = session ? '/customer/appointments' : '/auth/login'
  const profileHref      = session ? '/customer/profile'      : '/auth/login'

  const items = [
    ...BASE_ITEMS,
    { href: appointmentsHref, label: 'Randevular', Icon: CalendarDays },
    session
      ? { href: profileHref, label: 'Profil', Icon: User }
      : { href: '/auth/login', label: 'Giriş Yap', Icon: LogIn },
  ]

  return (
    <nav className="bk-bottom-nav" aria-label="Alt navigasyon">
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href + label}
          href={href}
          className={`bk-bottom-nav-item${isActive(href) ? ' active' : ''}`}
          aria-label={label}
        >
          <Icon size={22} strokeWidth={isActive(href) ? 2.2 : 1.8} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
