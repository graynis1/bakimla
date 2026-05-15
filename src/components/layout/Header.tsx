'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, User, LogOut, LayoutDashboard, Store, Settings, Bell, Heart, Menu, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface NotifItem {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifs, setNotifs] = useState<NotifItem[]>([])
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    const res = await fetch('/api/notifications')
    if (res.ok) {
      const data = await res.json()
      setUnread(data.unreadCount)
      setNotifs(data.notifications)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [])

  async function markAll() {
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'read_all' }) })
    setUnread(0)
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--line)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
      >
        <Bell size={17} color="var(--text)" />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1.5px solid white' }} />
        )}
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: 'white', border: '1px solid var(--line)', borderRadius: 18, minWidth: 320, maxWidth: 370, zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>Bildirimler</span>
              {unread > 0 && (
                <button onClick={markAll} style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700, border: 0, background: 'none', cursor: 'pointer', padding: 0 }}>Tümünü okundu işaretle</button>
              )}
            </div>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifs.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--muted-color)', fontSize: 13 }}>Bildirim bulunmuyor</div>
              ) : (
                notifs.map((n) => (
                  <div key={n.id} style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', background: n.isRead ? 'white' : '#fffdf7' }}>
                    <div style={{ fontWeight: n.isRead ? 600 : 800, fontSize: 13, color: 'var(--text)', marginBottom: 3 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-color)', marginBottom: 4, lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-color)', opacity: 0.7 }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: tr })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const NAV_LINKS = [
  { href: '/',              label: 'Ana Sayfa' },
  { href: '/search',        label: 'İşletmeler' },
  { href: '/search',        label: 'Kategoriler' },
  { href: '/kampanyalar',   label: 'Kampanyalar' },
  { href: '/blog',          label: 'Blog' },
]

export default function Header() {
  const { data: session } = useSession()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid var(--line)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="bk-header-inner" style={{
        maxWidth: 1320,
        margin: '0 auto',
        padding: '0 24px',
        height: 62,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>

        {/* ── Logo ── */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Image src="/logo.png" alt="Bakımla" width={200} height={54} className="bk-header-logo" style={{ objectFit: 'contain', height: 40, width: 'auto' }} priority />
        </Link>

        {/* ── Center Nav (desktop) ── */}
        <nav className="bk-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
          {NAV_LINKS.map((item, i) => {
            const active = pathname === item.href && item.href !== '/search'
            return (
              <Link
                key={i}
                href={item.href}
                style={{
                  position: 'relative',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 600,
                  color: active ? 'var(--brand)' : 'var(--text)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
                {active && (
                  <span style={{
                    position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                    width: 20, height: 2.5, borderRadius: 2, background: 'var(--gold)',
                  }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── Right: Auth + Mobile hamburger ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Favorites heart */}
          <Link href={session ? '/customer/favorites' : '/auth/login'} className="bk-desktop-nav" style={{
            width: 38, height: 38, borderRadius: 10,
            border: '1px solid var(--line)', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          }}>
            <Heart size={17} color="var(--text)" />
          </Link>

          {!session ? (
            <>
              <Link href="/auth/login" className="bk-desktop-nav" style={{ padding: '0 14px', height: 38, borderRadius: 10, fontSize: 13.5, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Giriş Yap
              </Link>
              <Link href="/auth/register" className="bk-register-btn" style={{ padding: '0 16px', height: 38, borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: 'white', textDecoration: 'none', background: 'var(--brand)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                Kayıt Ol
              </Link>
            </>
          ) : (
            <>
              <div className="bk-desktop-nav">
                <NotificationBell />
              </div>
              <div style={{ position: 'relative' }} className="bk-desktop-nav">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 12px', height: 38, borderRadius: 10, border: '1px solid var(--line)', background: 'white', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: 'white' }}>
                    {session.user.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="bk-username">{session.user.name}</span>
                  <ChevronDown size={13} color="var(--muted-color)" />
                </button>

                {userMenuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setUserMenuOpen(false)} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', border: '1px solid var(--line)', borderRadius: 18, padding: 8, minWidth: 210, zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
                      <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand)' }}>{session.user.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 2 }}>{session.user.email}</div>
                      </div>
                      {session.user.role === 'CUSTOMER' && (
                        <>
                          <MenuItem href="/customer/appointments" icon={<LayoutDashboard size={14} />} label="Randevularım" onClick={() => setUserMenuOpen(false)} />
                          <MenuItem href="/customer/favorites" icon={<Store size={14} />} label="Favorilerim" onClick={() => setUserMenuOpen(false)} />
                          <MenuItem href="/customer/profile" icon={<User size={14} />} label="Profilim" onClick={() => setUserMenuOpen(false)} />
                        </>
                      )}
                      {session.user.role === 'SALON_OWNER' && (
                        <>
                          <MenuItem href="/salon/dashboard" icon={<LayoutDashboard size={14} />} label="Salon Paneli" onClick={() => setUserMenuOpen(false)} />
                          <MenuItem href="/salon/calendar" icon={<Store size={14} />} label="Randevular" onClick={() => setUserMenuOpen(false)} />
                        </>
                      )}
                      {session.user.role === 'ADMIN' && (
                        <MenuItem href="/admin/dashboard" icon={<Settings size={14} />} label="Yönetim Paneli" onClick={() => setUserMenuOpen(false)} />
                      )}
                      <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none', background: 'none', fontSize: 13, fontWeight: 600, color: '#b42318', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <LogOut size={14} /> Çıkış Yap
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="bk-mobile-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--line)', background: 'white', display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu drawer ── */}
      {mobileMenuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(0,0,0,0.3)' }} onClick={() => setMobileMenuOpen(false)} />
          <div style={{
            position: 'fixed', top: 62, left: 0, right: 0, zIndex: 99,
            background: 'white', borderBottom: '1px solid var(--line)',
            padding: '12px 20px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
              {NAV_LINKS.map((item, i) => (
                <Link key={i} href={item.href} onClick={() => setMobileMenuOpen(false)} style={{ padding: '11px 12px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: pathname === item.href ? 'var(--brand)' : 'var(--text)', textDecoration: 'none', background: pathname === item.href ? 'var(--bg)' : 'transparent' }}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!session ? (
                <>
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 46, borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', border: '1.5px solid var(--line)' }}>
                    Giriş Yap
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 46, borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'white', textDecoration: 'none', background: 'var(--brand)' }}>
                    Kayıt Ol
                  </Link>
                </>
              ) : (
                <>
                  <div style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--bg)', marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand)' }}>{session.user.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>{session.user.email}</div>
                  </div>
                  {session.user.role === 'CUSTOMER' && (
                    <>
                      <MobileMenuItem href="/customer/appointments" label="Randevularım" onClick={() => setMobileMenuOpen(false)} />
                      <MobileMenuItem href="/customer/favorites" label="Favorilerim" onClick={() => setMobileMenuOpen(false)} />
                      <MobileMenuItem href="/customer/profile" label="Profilim" onClick={() => setMobileMenuOpen(false)} />
                    </>
                  )}
                  {session.user.role === 'SALON_OWNER' && (
                    <>
                      <MobileMenuItem href="/salon/dashboard" label="Salon Paneli" onClick={() => setMobileMenuOpen(false)} />
                      <MobileMenuItem href="/salon/calendar" label="Randevular" onClick={() => setMobileMenuOpen(false)} />
                    </>
                  )}
                  {session.user.role === 'ADMIN' && (
                    <MobileMenuItem href="/admin/dashboard" label="Yönetim Paneli" onClick={() => setMobileMenuOpen(false)} />
                  )}
                  <button
                    onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                    style={{ height: 46, borderRadius: 12, border: '1.5px solid #fecaca', background: 'none', fontSize: 15, fontWeight: 700, color: '#b42318', cursor: 'pointer' }}
                  >
                    Çıkış Yap
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
}

function MenuItem({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
      <span style={{ color: 'var(--brand)' }}>{icon}</span> {label}
    </Link>
  )
}

function MobileMenuItem({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{ display: 'flex', alignItems: 'center', height: 46, padding: '0 12px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', background: 'var(--bg)' }}>
      {label}
    </Link>
  )
}
