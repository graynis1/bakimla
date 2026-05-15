'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { Calendar, Clock, MapPin, Star, X } from 'lucide-react'

interface Appointment {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  price: number
  notes?: string | null
  business: { id: string; name: string; slug: string; coverImage?: string | null; city: string; district: string; phone: string }
  employee: { name: string; surname: string; title?: string | null }
  service: { name: string; duration: number; price: number }
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Beklemede', color: '#92400e', bg: '#fef3c7' },
  CONFIRMED: { label: 'Onaylandı', color: '#15803d', bg: '#f0fdf4' },
  COMPLETED: { label: 'Tamamlandı', color: '#1d4ed8', bg: '#eff6ff' },
  CANCELLED: { label: 'İptal', color: '#b42318', bg: '#fee2e2' },
  NO_SHOW: { label: 'Gelmedi', color: '#6b7280', bg: '#f3f4f6' },
}

export default function CustomerAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [reviewModal, setReviewModal] = useState<{ apptId: string; businessId: string } | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    fetchAppointments()
  }, [])

  async function fetchAppointments() {
    try {
      const res = await fetch('/api/appointments')
      const data = await res.json()
      if (data.success) setAppointments(data.data)
    } finally {
      setLoading(false)
    }
  }

  async function cancelAppointment(id: string) {
    if (!confirm('Randevuyu iptal etmek istediğinizden emin misiniz?')) return
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Randevu iptal edildi')
        fetchAppointments()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('Bir hata oluştu')
    }
  }

  async function submitReview() {
    if (!reviewModal) return
    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: reviewModal.businessId,
          appointmentId: reviewModal.apptId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Yorumunuz gönderildi')
        setReviewModal(null)
        setReviewComment('')
        setReviewRating(5)
      } else {
        toast.error(data.error)
      }
    } finally {
      setSubmittingReview(false)
    }
  }

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter)

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, height: 140 }} className="animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Randevularım</h1>
        <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none' }}>+ Yeni Randevu</Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['all', 'Tümü'], ['PENDING', 'Bekleyen'], ['CONFIRMED', 'Onaylı'], ['COMPLETED', 'Tamamlanan'], ['CANCELLED', 'İptal']].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{
              padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600,
              border: `1px solid ${filter === k ? 'var(--brand)' : 'var(--line)'}`,
              background: filter === k ? 'var(--brand)' : 'white',
              color: filter === k ? 'white' : 'var(--text)',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-color)' }}>
          <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Randevu bulunamadı</h3>
          <Link href="/" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>İşletme bul ve randevu al</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((appt) => {
            const st = STATUS_LABELS[appt.status] ?? STATUS_LABELS.PENDING
            const isPastOrCompleted = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status)
            const canCancel = ['PENDING', 'CONFIRMED'].includes(appt.status)
            const dateObj = new Date(appt.date)

            return (
              <div key={appt.id} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <Link href={`/salon/${appt.business.slug}`} style={{ fontWeight: 800, fontSize: 16, color: 'var(--brand)', textDecoration: 'none' }}>
                      {appt.business.name}
                    </Link>
                    <div style={{ fontSize: 13, color: 'var(--muted-color)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {appt.business.district}, {appt.business.city}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: 'var(--muted-color)', marginBottom: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={14} /> {format(dateObj, 'd MMMM yyyy EEEE', { locale: tr })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={14} /> {appt.startTime} — {appt.endTime}
                  </span>
                </div>

                <div className="bk-appt-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{appt.service.name}</span>
                    <span style={{ color: 'var(--muted-color)', fontSize: 13 }}> • {appt.employee.name} {appt.employee.surname}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 800, color: 'var(--brand)' }}>{formatPrice(appt.price)}</span>
                    {canCancel && (
                      <button
                        onClick={() => cancelAppointment(appt.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', border: '1px solid #fecaca', borderRadius: 10, background: 'white', color: '#b42318', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                      >
                        <X size={13} /> İptal Et
                      </button>
                    )}
                    {appt.status === 'COMPLETED' && (
                      <button
                        onClick={() => { setReviewModal({ apptId: appt.id, businessId: appt.business.id }); setReviewRating(5); setReviewComment('') }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', border: '1px solid var(--line)', borderRadius: 10, background: 'white', color: 'var(--brand)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                      >
                        <Star size={13} /> Yorum Yap
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setReviewModal(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 480, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: 20, fontSize: 18 }}>Yorum Yap</h3>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {[1,2,3,4,5].map((r) => (
                <button key={r} onClick={() => setReviewRating(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, color: r <= reviewRating ? '#d69b22' : '#e5e7eb' }}>
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Deneyiminizi paylaşın..."
              rows={4}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReviewModal(null)} style={{ flex: 1, height: 44, border: '1px solid var(--line)', borderRadius: 12, background: 'white', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button onClick={submitReview} disabled={submittingReview} style={{ flex: 1, height: 44, border: 0, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, cursor: submittingReview ? 'not-allowed' : 'pointer' }}>
                {submittingReview ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
