import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { formatPrice } from '@/lib/utils'

export default async function SalonCustomersPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const business = await prisma.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) redirect('/salon/dashboard')

  // Get unique customers with their appointment stats
  const customerAppointments = await prisma.appointment.findMany({
    where: { businessId: business.id },
    include: { customer: { select: { id: true, name: true, surname: true, email: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // Aggregate by customer
  const customerMap = new Map<string, {
    id: string; name: string; surname: string; email: string; phone?: string | null
    count: number; totalSpent: number; lastVisit: Date; firstVisit: Date
  }>()

  for (const appt of customerAppointments) {
    const c = appt.customer
    const existing = customerMap.get(c.id)
    const apptDate = new Date(appt.date)
    if (existing) {
      existing.count++
      if (appt.status === 'COMPLETED') existing.totalSpent += Number(appt.price)
      if (apptDate > existing.lastVisit) existing.lastVisit = apptDate
      if (apptDate < existing.firstVisit) existing.firstVisit = apptDate
    } else {
      customerMap.set(c.id, {
        id: c.id, name: c.name, surname: c.surname,
        email: c.email, phone: c.phone,
        count: 1,
        totalSpent: appt.status === 'COMPLETED' ? Number(appt.price) : 0,
        lastVisit: apptDate, firstVisit: apptDate,
      })
    }
  }

  const customers = Array.from(customerMap.values()).sort((a, b) => b.count - a.count)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Müşteriler</h1>
        <span style={{ fontSize: 13, color: 'var(--muted-color)', fontWeight: 600 }}>{customers.length} müşteri</span>
      </div>

      {customers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-color)', fontSize: 14 }}>
          Henüz müşteri yok.
        </div>
      ) : (
        <div className="bk-table-scroll" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid var(--line)', fontSize: 12, fontWeight: 700, color: 'var(--muted-color)' }}>
            <span>MÜŞTERİ</span>
            <span>RANDEVU</span>
            <span>HARCAMA</span>
            <span>İLK ZİYARET</span>
            <span>SON ZİYARET</span>
          </div>
          {customers.map((c) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--brand)', fontSize: 14, flexShrink: 0 }}>
                    {c.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name} {c.surname}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>{c.email}</div>
                    {c.phone && <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>{c.phone}</div>}
                  </div>
                </div>
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{c.count}</span>
                <div style={{ fontSize: 11, color: 'var(--muted-color)' }}>randevu</div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--brand)' }}>{formatPrice(c.totalSpent)}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>{format(c.firstVisit, 'd MMM yyyy', { locale: tr })}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>{format(c.lastVisit, 'd MMM yyyy', { locale: tr })}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
