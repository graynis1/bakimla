'use client'

import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/utils'
import { format, subMonths } from 'date-fns'
import { tr } from 'date-fns/locale'
import { TrendingUp, TrendingDown, CalendarDays, Users, Star, DollarSign } from 'lucide-react'

interface StatsData {
  thisMonthAppts: number
  lastMonthAppts: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  weekAppts: number
  totalCustomers: number
  statusCounts: { status: string; _count: number }[]
  topServices: { serviceId: string; name: string; _count: number }[]
  monthlyTrend: { month: string; count: number }[]
  rating: number
  reviewCount: number
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Beklemede',
  CONFIRMED: 'Onaylandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal',
  NO_SHOW: 'Gelmedi',
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#22c55e',
  COMPLETED: '#3b82f6',
  CANCELLED: '#ef4444',
  NO_SHOW: '#9ca3af',
}

export default function SalonStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/salon/stats')
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data) })
      .finally(() => setLoading(false))
  }, [])

  function pct(current: number, prev: number) {
    if (prev === 0) return current > 0 ? 100 : 0
    return Math.round(((current - prev) / prev) * 100)
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[1,2,3,4].map((i) => <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, height: 120 }} className="animate-pulse" />)}
    </div>
  )

  if (!stats) return null

  const apptPct = pct(stats.thisMonthAppts, stats.lastMonthAppts)
  const revPct = pct(stats.thisMonthRevenue, stats.lastMonthRevenue)
  const maxMonthly = Math.max(...stats.monthlyTrend.map((m) => m.count), 1)

  const totalAppts = stats.statusCounts.reduce((s, c) => s + c._count, 0)

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', marginBottom: 24 }}>İstatistikler</h1>

      {/* Top KPIs */}
      <div className="bk-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <KPICard
          icon={<CalendarDays size={20} />}
          label="Bu Ay Randevu"
          value={String(stats.thisMonthAppts)}
          pct={apptPct}
          sub={`Geçen ay: ${stats.lastMonthAppts}`}
        />
        <KPICard
          icon={<DollarSign size={20} />}
          label="Bu Ay Gelir"
          value={formatPrice(stats.thisMonthRevenue)}
          pct={revPct}
          sub={`Geçen ay: ${formatPrice(stats.lastMonthRevenue)}`}
          highlight
        />
        <KPICard
          icon={<Users size={20} />}
          label="Toplam Müşteri"
          value={String(stats.totalCustomers)}
          sub={`Bu hafta: ${stats.weekAppts} randevu`}
        />
        <KPICard
          icon={<Star size={20} />}
          label="Ortalama Puan"
          value={stats.rating.toFixed(1)}
          sub={`${stats.reviewCount} yorum`}
        />
      </div>

      <div className="bk-grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Monthly trend chart */}
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Aylık Randevu Trendi</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
            {stats.monthlyTrend.map((m, i) => {
              const h = Math.max((m.count / maxMonthly) * 120, 4)
              const isLast = i === stats.monthlyTrend.length - 1
              return (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isLast ? 'var(--brand)' : 'var(--muted-color)' }}>{m.count}</div>
                  <div style={{ width: '100%', height: h, borderRadius: 6, background: isLast ? 'var(--brand)' : 'var(--surface-2)', transition: 'height 0.3s' }} />
                  <div style={{ fontSize: 10, color: 'var(--muted-color)', textAlign: 'center' }}>
                    {format(new Date(m.month), 'MMM', { locale: tr })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status breakdown */}
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Randevu Durumları</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.statusCounts.map((s) => {
              const pctVal = totalAppts > 0 ? Math.round((s._count / totalAppts) * 100) : 0
              const color = STATUS_COLORS[s.status] ?? '#9ca3af'
              return (
                <div key={s.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{STATUS_LABELS[s.status] ?? s.status}</span>
                    <span style={{ color: 'var(--muted-color)' }}>{s._count} ({pctVal}%)</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pctVal}%`, background: color, borderRadius: 99 }} />
                  </div>
                </div>
              )
            })}
            {stats.statusCounts.length === 0 && (
              <p style={{ color: 'var(--muted-color)', fontSize: 14 }}>Henüz randevu yok.</p>
            )}
          </div>
        </div>
      </div>

      {/* Top services */}
      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>En Çok Tercih Edilen Hizmetler</div>
        {stats.topServices.length === 0 ? (
          <p style={{ color: 'var(--muted-color)', fontSize: 14 }}>Henüz veri yok.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.topServices.map((s, i) => {
              const maxCount = stats.topServices[0]._count
              const pctVal = Math.round((s._count / maxCount) * 100)
              return (
                <div key={s.serviceId} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? 'var(--brand)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: i === 0 ? 'white' : 'var(--text)', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700 }}>{s.name}</span>
                      <span style={{ color: 'var(--muted-color)' }}>{s._count} randevu</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pctVal}%`, background: 'var(--brand)', borderRadius: 99 }} />
                    </div>
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

function KPICard({ icon, label, value, pct, sub, highlight }: { icon: React.ReactNode; label: string; value: string; pct?: number; sub?: string; highlight?: boolean }) {
  const isUp = (pct ?? 0) >= 0
  return (
    <div style={{ background: highlight ? 'var(--brand)' : 'white', border: '1px solid var(--line)', borderRadius: 18, padding: 20 }}>
      <div style={{ color: highlight ? 'rgba(255,255,255,0.6)' : 'var(--muted-color)', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: highlight ? 'white' : 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: highlight ? 'rgba(255,255,255,0.7)' : 'var(--muted-color)', marginTop: 4 }}>{label}</div>
      {pct !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, fontWeight: 700, color: highlight ? 'rgba(255,255,255,0.8)' : (isUp ? '#15803d' : '#b42318') }}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isUp ? '+' : ''}{pct}% geçen aya göre
        </div>
      )}
      {sub && <div style={{ fontSize: 11, color: highlight ? 'rgba(255,255,255,0.6)' : 'var(--muted-color)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
