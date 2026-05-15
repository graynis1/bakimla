import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { formatPrice } from '@/lib/utils'
import { isSubscriptionActive } from '@/lib/subscription'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Aktif', color: '#15803d', bg: '#f0fdf4' },
  TRIAL: { label: 'Deneme', color: '#92400e', bg: '#fef3c7' },
  EXPIRED: { label: 'Süresi Doldu', color: '#b42318', bg: '#fee2e2' },
  CANCELLED: { label: 'İptal', color: '#6b7280', bg: '#f3f4f6' },
  PENDING_PAYMENT: { label: 'Ödeme Bekleniyor', color: '#1d4ed8', bg: '#eff6ff' },
}

export default async function AdminSubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    include: {
      business: { select: { name: true, city: true } },
      plan: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', marginBottom: 20 }}>Abonelikler</h1>

      <div className="bk-table-scroll" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid var(--line)', fontSize: 12, fontWeight: 700, color: 'var(--muted-color)' }}>
          <span>İŞLETME</span>
          <span>PLAN</span>
          <span>DURUM</span>
          <span>BİTİŞ</span>
          <span>TUTAR</span>
        </div>
        {subscriptions.map((sub) => {
          const st = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.EXPIRED
          const active = isSubscriptionActive(sub)
          return (
            <div key={sub.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{sub.business.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>{sub.business.city}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{sub.plan.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>Maks. {sub.plan.maxEmployees} çalışan</div>
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: st.bg, color: st.color }}>
                  {st.label}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted-color)' }}>
                {sub.endDate ? format(new Date(sub.endDate), 'd MMM yyyy', { locale: tr }) : sub.trialEndsAt ? format(new Date(sub.trialEndsAt), 'd MMM yyyy', { locale: tr }) : '—'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {formatPrice(sub.plan.monthlyPrice)}<span style={{ fontSize: 11, color: 'var(--muted-color)', fontWeight: 400 }}>/ay</span>
              </div>
            </div>
          )
        })}
        {subscriptions.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted-color)', fontSize: 14 }}>Henüz abonelik yok.</div>
        )}
      </div>
    </div>
  )
}
