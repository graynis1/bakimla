import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Store, Users, CreditCard, Banknote, FileCheck, Settings, CalendarDays, SlidersHorizontal, BookOpen, Tag } from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
  { href: '/admin/businesses', label: 'İşletmeler', icon: Store },
  { href: '/admin/appointments', label: 'Randevular', icon: CalendarDays },
  { href: '/admin/users', label: 'Kullanıcılar', icon: Users },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/campaigns', label: 'Kampanyalar', icon: Tag },
  { href: '/admin/payments', label: 'Ödemeler', icon: FileCheck },
  { href: '/admin/subscriptions', label: 'Abonelikler', icon: CreditCard },
  { href: '/admin/plans', label: 'Planlar', icon: Settings },
  { href: '/admin/bank-accounts', label: 'Banka Hesapları', icon: Banknote },
  { href: '/admin/settings', label: 'Sistem Ayarları', icon: SlidersHorizontal },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/admin/login')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 20px' }}>
        <div className="bk-panel-layout" style={{ display: 'grid', gap: 24 }}>
          <div className="bk-panel-sidebar" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20, height: 'fit-content', position: 'sticky', top: 90 }}>
            <div style={{ marginBottom: 12, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Image src="/logo-icon.png" alt="Bakımla" width={38} height={46} style={{ objectFit: 'contain', height: 40, width: 'auto' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--brand)' }}>Bakımla</div>
                  <div style={{ fontWeight: 600, fontSize: 10, color: 'var(--muted-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Yönetim Paneli</div>
                </div>
              </div>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}
                >
                  <item.icon size={15} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div>{children}</div>
        </div>
      </main>
    </div>
  )
}
