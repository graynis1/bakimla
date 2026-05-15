'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { formatPrice } from '@/lib/utils'
import { Calendar, Clock, User, Scissors, Store } from 'lucide-react'

interface Appointment {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  price: number
  notes: string | null
  createdAt: string
  business: { id: string; name: string; slug: string }
  customer: { name: string; surname: string; email: string }
  employee: { name: string; surname: string }
  service: { name: string }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Beklemede', color: '#92400e', bg: '#fef3c7' },
  CONFIRMED: { label: 'Onaylandı', color: '#15803d', bg: '#f0fdf4' },
  CANCELLED: { label: 'İptal', color: '#b42318', bg: '#fee2e2' },
  COMPLETED: { label: 'Tamamlandı', color: '#1d4ed8', bg: '#eff6ff' },
  NO_SHOW: { label: 'Gelmedi', color: '#6b7280', bg: '#f3f4f6' },
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setPage(1)
    fetchAppointments(1)
  }, [filter])

  async function fetchAppointments(p: number) {
    setLoading(true)
    const statusParam = filter !== 'ALL' ? `&status=${filter}` : ''
    const res = await fetch(`/api/admin/appointments?page=${p}${statusParam}`)
    const data = await res.json()
    if (data.success) {
      setAppointments(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    }
    setLoading(false)
  }

  function goPage(p: number) {
    setPage(p)
    fetchAppointments(p)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Randevular</h1>
        <span style={{ fontSize: 13, color: 'var(--muted-color)', fontWeight: 600 }}>Toplam: {total}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${filter === s ? 'var(--brand)' : 'var(--line)'}`,
              background: filter === s ? 'var(--brand)' : 'white',
              color: filter === s ? 'white' : 'var(--text)',
            }}
          >
            {s === 'ALL' ? 'Tümü' : STATUS_CONFIG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 14, height: 96 }} className="animate-pulse" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-color)', fontSize: 14 }}>
          Bu filtre için randevu bulunamadı.
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
          {appointments.map((a) => {
            const st = STATUS_CONFIG[a.status]
            return (
              <div key={a.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color, fontWeight: 700, flexShrink: 0 }}>
                      {st.label}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{a.service.name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--brand)', fontSize: 14 }}>{formatPrice(a.price)}</span>
                  </div>
                  <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-color)' }}>
                      <Store size={13} /> {a.business.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-color)' }}>
                      <User size={13} /> {a.customer.name} {a.customer.surname}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-color)' }}>
                      <Scissors size={13} /> {a.employee.name} {a.employee.surname}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-color)' }}>
                      <Calendar size={13} /> {format(new Date(a.date), 'd MMM yyyy', { locale: tr })}
                      <Clock size={13} style={{ marginLeft: 8 }} /> {a.startTime}
                    </div>
                  </div>
                  {a.notes && (
                    <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 6, fontStyle: 'italic' }}>
                      Not: {a.notes}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goPage(p)}
              style={{
                width: 36, height: 36, borderRadius: 10, border: `1px solid ${p === page ? 'var(--brand)' : 'var(--line)'}`,
                background: p === page ? 'var(--brand)' : 'white',
                color: p === page ? 'white' : 'var(--text)',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
