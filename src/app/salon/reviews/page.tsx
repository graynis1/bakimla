'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Star, Eye, EyeOff, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface Review {
  id: string
  rating: number
  comment?: string | null
  isVisible: boolean
  createdAt: string
  customer: { name: string; surname: string }
}

export default function SalonReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [canHideReviews, setCanHideReviews] = useState(true)

  useEffect(() => {
    fetchReviews()
    fetch('/api/salon/subscription-limit')
      .then(r => r.json())
      .then(d => { if (d.success) setCanHideReviews(d.data.canHideReviews) })
  }, [])

  async function fetchReviews() {
    const res = await fetch('/api/salon/reviews')
    const data = await res.json()
    if (data.success) setReviews(data.data)
    setLoading(false)
  }

  async function toggleVisibility(id: string, current: boolean) {
    const res = await fetch(`/api/salon/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !current }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success(current ? 'Yorum gizlendi' : 'Yorum gösterildi')
      fetchReviews()
    } else toast.error(data.error)
  }

  const visibleReviews = reviews.filter((r) => r.isVisible)
  const avg = visibleReviews.length > 0 ? (visibleReviews.reduce((sum, r) => sum + r.rating, 0) / visibleReviews.length).toFixed(1) : '—'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Yorumlar</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 18, color: '#d69b22' }}>
          <Star size={20} fill="currentColor" /> {avg}
        </div>
      </div>

      {!canHideReviews && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Lock size={16} color="#f97316" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#9a3412' }}>
            Yorum gizleme özelliği bu pakette mevcut değil.{' '}
            <a href="/salon/subscription" style={{ color: '#f97316', fontWeight: 700, textDecoration: 'none' }}>Üst pakete geçin</a>.
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map((i) => <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16, height: 80 }} className="animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-color)', fontSize: 14 }}>Henüz yorum yapılmamış.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ background: r.isVisible ? 'white' : '#f9f9f9', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 18px', opacity: r.isVisible ? 1 : 0.7 }}>
              <div className="bk-review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{r.customer.name} {r.customer.surname}</span>
                  <div style={{ color: '#d69b22', fontSize: 14, marginTop: 2 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted-color)' }}>{format(new Date(r.createdAt), 'd MMM yyyy', { locale: tr })}</span>
                  {canHideReviews && (
                    <button
                      onClick={() => toggleVisibility(r.id, r.isVisible)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', border: '1px solid var(--line)', borderRadius: 8, background: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--muted-color)' }}
                    >
                      {r.isVisible ? <><EyeOff size={12} /> Gizle</> : <><Eye size={12} /> Göster</>}
                    </button>
                  )}
                </div>
              </div>
              {r.comment && <p style={{ fontSize: 14, color: 'var(--muted-color)', lineHeight: 1.6 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
