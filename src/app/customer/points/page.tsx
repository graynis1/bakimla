'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Star, TrendingUp, Gift } from 'lucide-react'

interface PointTransaction {
  id: string
  points: number
  type: 'EARNED' | 'SPENT' | 'EXPIRED'
  description: string
  createdAt: string
}

interface LoyaltyData {
  points: number
  totalEarned: number
  totalSpent: number
  transactions: PointTransaction[]
}

export default function CustomerPointsPage() {
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users/points')
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', marginBottom: 20 }}>Puanlarım</h1>
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, height: 140 }} className="animate-pulse" />
      </div>
    )
  }

  const points = data?.points ?? 0
  const totalEarned = data?.totalEarned ?? 0
  const transactions = data?.transactions ?? []

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', marginBottom: 20 }}>Puanlarım</h1>

      {/* Points summary */}
      <div className="bk-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: 'var(--brand)', color: 'white', borderRadius: 18, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, opacity: 0.7, fontSize: 13 }}>
            <Star size={14} /> Mevcut Puan
          </div>
          <div style={{ fontSize: 36, fontWeight: 900 }}>{points}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--muted-color)', fontSize: 13 }}>
            <TrendingUp size={14} /> Toplam Kazanılan
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)' }}>{totalEarned}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--muted-color)', fontSize: 13 }}>
            <Gift size={14} /> Kullanılan
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--muted-color)' }}>{data?.totalSpent ?? 0}</div>
        </div>
      </div>

      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 14, padding: 14, fontSize: 13, color: '#92400e', marginBottom: 24 }}>
        Her 10 TL harcamada 1 puan kazanırsınız. 100 puan = 10 TL indirim.
      </div>

      {/* Transaction history */}
      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', fontWeight: 800, fontSize: 16 }}>İşlem Geçmişi</div>
        {transactions.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted-color)', fontSize: 14 }}>
            Henüz puan işlemi bulunmuyor.
          </div>
        ) : (
          <div>
            {transactions.map((t) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 2 }}>
                    {format(new Date(t.createdAt), 'd MMM yyyy', { locale: tr })}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: t.type === 'EARNED' ? 'var(--green)' : '#b42318' }}>
                  {t.type === 'EARNED' ? '+' : '-'}{t.points} puan
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
