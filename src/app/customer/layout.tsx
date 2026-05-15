import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { CalendarDays, Heart, Star, User } from 'lucide-react'

const navItems = [
  { href: '/customer/appointments', label: 'Randevularım', icon: CalendarDays },
  { href: '/customer/favorites', label: 'Favorilerim', icon: Heart },
  { href: '/customer/points', label: 'Puanlarım', icon: Star },
  { href: '/customer/profile', label: 'Profilim', icon: User },
]

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'CUSTOMER') redirect('/auth/login')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 20px' }}>
        <div className="bk-panel-layout" style={{ display: 'grid', gap: 24 }}>
          {/* Sidebar */}
          <div className="bk-panel-sidebar" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20, height: 'fit-content', position: 'sticky', top: 90 }}>
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--brand)' }}>{session.user.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 2 }}>Müşteri Hesabı</div>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}
                >
                  <item.icon size={16} style={{ color: 'var(--brand)' }} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div>{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
