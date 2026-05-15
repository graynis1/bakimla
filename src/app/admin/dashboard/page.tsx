import { prisma } from '@/lib/prisma'
import { Store, Users, CreditCard, AlertCircle, CalendarDays, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default async function AdminDashboardPage() {
  const [
    totalBusinesses, pendingBusinesses,
    totalUsers, totalRevenue, pendingPayments, activeSubscriptions,
    totalAppointments, pendingAppointments,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.payment.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.subscription.count({ where: { status: { in: ['ACTIVE', 'TRIAL'] } } }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'PENDING' } }),
  ])

  const [recentPayments, recentBusinesses, recentAppointments] = await Promise.all([
    prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: { business: { select: { name: true } }, plan: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.business.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, category: true, city: true, createdAt: true },
    }),
    prisma.appointment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        business: { select: { name: true } },
        customer: { select: { name: true, surname: true } },
        service: { select: { name: true } },
      },
    }),
  ])

  const revenue = totalRevenue._sum.amount?.toNumber() ?? 0

  const APPT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Beklemede', color: '#92400e', bg: '#fef3c7' },
    CONFIRMED: { label: 'Onaylandı', color: '#15803d', bg: '#f0fdf4' },
    CANCELLED: { label: 'İptal', color: '#b42318', bg: '#fee2e2' },
    COMPLETED: { label: 'Tamamlandı', color: '#1d4ed8', bg: '#eff6ff' },
    NO_SHOW: { label: 'Gelmedi', color: '#6b7280', bg: '#f3f4f6' },
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', marginBottom: 24 }}>Yönetim Genel Bakış</h1>

      <div className="bk-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard icon={<Store size={20} />} label="Toplam İşletme" value={String(totalBusinesses)} sub={`${pendingBusinesses} onay bekliyor`} warn={pendingBusinesses > 0} />
        <StatCard icon={<Users size={20} />} label="Müşteri" value={String(totalUsers)} />
        <StatCard icon={<CalendarDays size={20} />} label="Toplam Randevu" value={String(totalAppointments)} sub={`${pendingAppointments} beklemede`} warn={pendingAppointments > 0} />
        <StatCard icon={<AlertCircle size={20} />} label="Toplam Gelir" value={formatPrice(revenue)} highlight />
      </div>

      <div className="bk-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Pending payments */}
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>Bekleyen Ödemeler</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {pendingPayments > 0 && <span style={{ background: '#fee2e2', color: '#b42318', fontWeight: 800, fontSize: 12, padding: '2px 8px', borderRadius: 99 }}>{pendingPayments}</span>}
              <Link href="/admin/payments" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Tümü →</Link>
            </div>
          </div>
          {recentPayments.length === 0 ? (
            <div style={{ padding: 20, fontSize: 14, color: 'var(--muted-color)' }}>Bekleyen ödeme yok.</div>
          ) : (
            recentPayments.map((p) => (
              <div key={p.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.business.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>{p.plan.name}</div>
                </div>
                <span style={{ fontWeight: 800, color: 'var(--brand)' }}>{formatPrice(p.amount.toNumber())}</span>
              </div>
            ))
          )}
        </div>

        {/* Pending businesses */}
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>Onay Bekleyen İşletmeler</span>
            <Link href="/admin/businesses" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Tümü →</Link>
          </div>
          {recentBusinesses.length === 0 ? (
            <div style={{ padding: 20, fontSize: 14, color: 'var(--muted-color)' }}>Bekleyen işletme yok.</div>
          ) : (
            recentBusinesses.map((b) => (
              <div key={b.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>{b.city} • {format(new Date(b.createdAt), 'd MMM', { locale: tr })}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent appointments */}
      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>Son Randevular</span>
          <Link href="/admin/appointments" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Tümü →</Link>
        </div>
        {recentAppointments.length === 0 ? (
          <div style={{ padding: 20, fontSize: 14, color: 'var(--muted-color)' }}>Henüz randevu yok.</div>
        ) : (
          <div className="bk-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {recentAppointments.map((a) => {
              const st = APPT_STATUS[a.status]
              return (
                <div key={a.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{a.service.name}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: st.bg, color: st.color, fontWeight: 700 }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>{a.business.name} • {a.customer.name} {a.customer.surname}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-color)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Clock size={10} /> {a.startTime} • {format(new Date(a.date), 'd MMM', { locale: tr })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, highlight, warn }: { icon: React.ReactNode; label: string; value: string; sub?: string; highlight?: boolean; warn?: boolean }) {
  return (
    <div style={{ background: highlight ? 'var(--brand)' : 'white', border: `1px solid ${warn ? '#fecaca' : 'var(--line)'}`, borderRadius: 18, padding: 20 }}>
      <div style={{ color: highlight ? 'rgba(255,255,255,0.6)' : warn ? '#ef4444' : 'var(--muted-color)', marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: highlight ? 'white' : warn ? '#ef4444' : 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: highlight ? 'rgba(255,255,255,0.7)' : 'var(--muted-color)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, marginTop: 4, color: warn ? '#ef4444' : 'var(--muted-color)' }}>{sub}</div>}
    </div>
  )
}
