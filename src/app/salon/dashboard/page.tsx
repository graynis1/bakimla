import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
import { isSubscriptionActive } from '@/lib/subscription'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Star, AlertCircle } from 'lucide-react'

export default async function SalonDashboardPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
    include: { subscription: { include: { plan: true } }, employees: { where: { isActive: true } } },
  })

  if (!business) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-color)' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>İşletme bulunamadı</h3>
        <p style={{ fontSize: 14 }}>Hesabınıza bağlı bir işletme bulunamadı.</p>
      </div>
    )
  }

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const [todayAppointments, weekAppointments, monthAppointments, monthRevenue, pendingCount] = await Promise.all([
    prisma.appointment.count({ where: { businessId: business.id, date: { gte: todayStart, lte: todayEnd }, status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.appointment.count({ where: { businessId: business.id, date: { gte: weekStart, lte: weekEnd } } }),
    prisma.appointment.count({ where: { businessId: business.id, date: { gte: monthStart, lte: monthEnd } } }),
    prisma.appointment.aggregate({ where: { businessId: business.id, status: 'COMPLETED', date: { gte: monthStart, lte: monthEnd } }, _sum: { price: true } }),
    prisma.appointment.count({ where: { businessId: business.id, status: 'PENDING' } }),
  ])

  const recentAppointments = await prisma.appointment.findMany({
    where: { businessId: business.id },
    include: {
      customer: { select: { name: true, surname: true } },
      service: { select: { name: true } },
      employee: { select: { name: true, surname: true } },
    },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    take: 8,
  })

  const subscriptionOk = business.subscription ? isSubscriptionActive(business.subscription) : false
  const revenue = monthRevenue._sum.price?.toNumber() ?? 0

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Beklemede', color: '#92400e', bg: '#fef3c7' },
    CONFIRMED: { label: 'Onaylandı', color: '#15803d', bg: '#f0fdf4' },
    COMPLETED: { label: 'Tamamlandı', color: '#1d4ed8', bg: '#eff6ff' },
    CANCELLED: { label: 'İptal', color: '#b42318', bg: '#fee2e2' },
    NO_SHOW: { label: 'Gelmedi', color: '#6b7280', bg: '#f3f4f6' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Genel Bakış</h1>
        <div style={{ fontSize: 13, color: 'var(--muted-color)' }}>{format(now, 'd MMMM yyyy EEEE', { locale: tr })}</div>
      </div>

      {/* Subscription warning */}
      {!subscriptionOk && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#b42318', fontSize: 14, fontWeight: 600 }}>
            <AlertCircle size={18} />
            Aktif aboneliğiniz bulunmuyor. Yeni randevu kabul edilmiyor.
          </div>
          <Link href="/salon/subscription" style={{ fontSize: 13, fontWeight: 700, color: '#b42318', textDecoration: 'underline' }}>Abonelik Al</Link>
        </div>
      )}

      {/* Stats */}
      <div className="bk-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--muted-color)', fontWeight: 600, marginBottom: 6 }}>Bugünkü Randevu</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{todayAppointments}</div>
          <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 6 }}>Bu hafta: {weekAppointments}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--muted-color)', fontWeight: 600, marginBottom: 6 }}>Bu Ay Randevu</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{monthAppointments}</div>
          <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 6 }}>Onay bekleyen: {pendingCount}</div>
        </div>
        <div style={{ background: 'var(--brand)', border: '1px solid var(--brand)', borderRadius: 18, padding: 20 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 6 }}>Aylık Gelir</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1 }}>{formatPrice(revenue)}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>Tamamlanan randevular</div>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--muted-color)', fontWeight: 600, marginBottom: 6 }}>Ortalama Puan</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={22} fill="#d69b22" color="#d69b22" />
            {business.rating.toFixed(1)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 6 }}>{business.reviewCount} yorum</div>
        </div>
      </div>

      {/* Business status */}
      {business.status === 'PENDING' && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 14, padding: 16, marginBottom: 20, fontSize: 14, color: '#92400e' }}>
          İşletmeniz admin onayı bekliyor. Onaylandıktan sonra randevu kabul edebilirsiniz.
        </div>
      )}

      {/* Recent appointments */}
      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Son Randevular</span>
          <Link href="/salon/calendar" style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Tümünü Gör</Link>
        </div>
        {recentAppointments.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted-color)', fontSize: 14 }}>Henüz randevu bulunmuyor.</div>
        ) : (
          recentAppointments.map((appt) => {
            const st = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.PENDING
            return (
              <div key={appt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 700 }}>{appt.customer.name} {appt.customer.surname}</div>
                    <div style={{ color: 'var(--muted-color)', marginTop: 2 }}>{appt.service.name} • {appt.employee.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                  <span style={{ color: 'var(--muted-color)' }}>{format(new Date(appt.date), 'd MMM', { locale: tr })} {appt.startTime}</span>
                  <span style={{ fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: st.bg, color: st.color, fontSize: 12 }}>{st.label}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

