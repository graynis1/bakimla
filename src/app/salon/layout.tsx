import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import NextImage from 'next/image'
import { LayoutDashboard, Store, Users, Scissors, Image, CalendarDays, Star, CreditCard, UmbrellaOff, BarChart2, Settings, UserCheck } from 'lucide-react'

const navItems = [
  { href: '/salon/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/salon/calendar', label: 'Randevular', icon: CalendarDays },
  { href: '/salon/employees', label: 'Çalışanlar', icon: Users },
  { href: '/salon/services', label: 'Hizmetler', icon: Scissors },
  { href: '/salon/reviews', label: 'Yorumlar', icon: Star },
  { href: '/salon/customers', label: 'Müşteriler', icon: UserCheck },
  { href: '/salon/stats', label: 'İstatistikler', icon: BarChart2 },
  { href: '/salon/gallery', label: 'Galeri', icon: Image },
  { href: '/salon/profile', label: 'Salon Profilim', icon: Store },
  { href: '/salon/holidays', label: 'Tatil Günleri', icon: UmbrellaOff },
  { href: '/salon/subscription', label: 'Abonelik', icon: CreditCard },
  { href: '/salon/settings', label: 'Ayarlar', icon: Settings },
]

export default async function SalonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Non-SALON_OWNER: public business profile routes — proxy.ts already blocks panel routes
  if (!session || session.user.role !== 'SALON_OWNER') {
    return <>{children}</>
  }

  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, status: true, slug: true },
  })

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 1220, margin: '0 auto', padding: '32px 20px' }}>
        <div className="bk-panel-layout" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
          {/* Sidebar */}
          <div className="bk-panel-sidebar" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20, height: 'fit-content', position: 'sticky', top: 90 }}>
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
              <NextImage src="/logo-icon.png" alt="Bakımla" width={38} height={46} style={{ objectFit: 'contain', height: 40, width: 'auto', marginBottom: 6 }} />
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand)', lineHeight: 1.3 }}>{business?.name || 'İşletmem'}</div>
              {business?.status === 'PENDING' && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 99, marginTop: 6, display: 'inline-block' }}>Onay Bekliyor</div>
              )}
              {business?.status === 'APPROVED' && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', background: '#f0fdf4', padding: '2px 8px', borderRadius: 99, marginTop: 6, display: 'inline-block' }}>Aktif</div>
              )}
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

          {/* Content */}
          <div>{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
