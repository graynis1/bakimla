'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { Check, X, ExternalLink } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  period: string
  status: string
  receiptUrl?: string | null
  createdAt: string
  business: { name: string; id: string }
  plan: { name: string; id: string; maxEmployees: number }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Beklemede', color: '#92400e', bg: '#fef3c7' },
  APPROVED: { label: 'Onaylandı', color: '#15803d', bg: '#f0fdf4' },
  REJECTED: { label: 'Reddedildi', color: '#b42318', bg: '#fee2e2' },
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => { fetchPayments() }, [filter])

  async function fetchPayments() {
    setLoading(true)
    const res = await fetch(`/api/admin/payments?status=${filter}`)
    const data = await res.json()
    if (data.success) setPayments(data.data)
    setLoading(false)
  }

  async function updatePayment(id: string, status: string) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(status === 'APPROVED' ? 'Ödeme onaylandı, abonelik aktifleştirildi' : 'Ödeme reddedildi')
        fetchPayments()
      } else toast.error(data.error)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', marginBottom: 20 }}>Ödemeler</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['PENDING', 'APPROVED', 'REJECTED'].map((s) => {
          const st = STATUS_CONFIG[s]
          return (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, border: `1px solid ${filter === s ? 'var(--brand)' : 'var(--line)'}`, background: filter === s ? 'var(--brand)' : 'white', color: filter === s ? 'white' : 'var(--text)', cursor: 'pointer' }}>
              {st.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map((i) => <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 14, height: 80 }} className="animate-pulse" />)}
        </div>
      ) : payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-color)', fontSize: 14 }}>Bu durumda ödeme bulunamadı.</div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
          {payments.map((p) => {
            const st = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.PENDING
            return (
              <div key={p.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{p.business.name}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color, fontWeight: 700 }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted-color)' }}>
                      {p.plan.name} • {p.period === 'monthly' ? 'Aylık' : 'Yıllık'} • {format(new Date(p.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}
                    </div>
                  </div>
                  <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--brand)' }}>{formatPrice(p.amount)}</span>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {p.receiptUrl && (
                    <a href={p.receiptUrl} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', border: '1px solid var(--line)', borderRadius: 10, background: 'white', color: 'var(--muted-color)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                      <ExternalLink size={13} /> Dekontu Gör
                    </a>
                  )}
                  {p.status === 'PENDING' && (
                    <>
                      <button onClick={() => updatePayment(p.id, 'APPROVED')} disabled={updating === p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 16px', border: '1px solid #86efac', borderRadius: 10, background: 'white', color: '#15803d', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        <Check size={13} /> Onayla
                      </button>
                      <button onClick={() => updatePayment(p.id, 'REJECTED')} disabled={updating === p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', border: '1px solid #fecaca', borderRadius: 10, background: 'white', color: '#b42318', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                        <X size={13} /> Reddet
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
