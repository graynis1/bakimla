'use client'

import { notFound, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { categoryLabels, formatPrice } from '@/lib/utils'
import { MapPin, Phone, Star, Heart, CheckCircle2, ChevronRight, Mail, CalendarDays, Home, LayoutGrid, User, Users, MessageCircle, Camera, Scissors } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

type WorkingHours = Record<string, { open: string; close: string; isOpen: boolean }>

function isOpenNow(wh: WorkingHours) {
  const now = new Date()
  const key = ['sun','mon','tue','wed','thu','fri','sat'][now.getDay()]
  const h = wh[key]
  if (!h?.isOpen) return false
  const [oh,om] = h.open.split(':').map(Number)
  const [ch,cm] = h.close.split(':').map(Number)
  const mins = now.getHours()*60+now.getMinutes()
  return mins >= oh*60+om && mins <= ch*60+cm
}

function getTodayHours(wh: WorkingHours) {
  const key = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()]
  const h = wh[key]
  if (!h?.isOpen) return 'Bugün Kapalı'
  return `${h.open} — ${h.close}`
}

const DAY_NAMES: Record<string, string> = {
  mon:'Pazartesi', tue:'Salı', wed:'Çarşamba', thu:'Perşembe',
  fri:'Cuma', sat:'Cumartesi', sun:'Pazar',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:'Beklemede', CONFIRMED:'Onaylandı', COMPLETED:'Tamamlandı',
  CANCELLED:'İptal', NO_SHOW:'Gelmedi',
}

export default function BusinessProfilePage() {
  const params = useParams()
  const slug = params.slug as string
  const { data: session } = useSession()

  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [favorited, setFavorited] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    fetch(`/api/businesses/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setBusiness(d.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!session || !business?.id) return
    fetch(`/api/favorites?businessId=${business.id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setFavorited(d.data.isFavorited) })
  }, [session, business?.id])

  async function toggleFavorite() {
    if (!session) { toast.error('Favorilere eklemek için giriş yapın'); return }
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: business.id }),
    })
    const data = await res.json()
    if (data.success) {
      setFavorited(data.data.isFavorited)
      toast.success(data.data.isFavorited ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı')
    }
  }

  async function submitReview() {
    if (!session) { toast.error('Yorum yapmak için giriş yapın'); return }
    setSubmittingReview(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: business.id, rating: reviewRating, comment: reviewComment }),
    })
    const data = await res.json()
    setSubmittingReview(false)
    if (data.success) {
      toast.success('Yorumunuz gönderildi')
      setReviewComment('')
      setReviewRating(5)
      // Refresh
      fetch(`/api/businesses/${slug}`).then(r => r.json()).then(d => { if (d.success) setBusiness(d.data) })
    } else {
      toast.error(data.error || 'Yorum gönderilemedi')
    }
  }

  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 28px' }}>
        <div style={{ height: 300, background: 'white', border: '1px solid var(--line)', borderRadius: 20 }} className="animate-pulse" />
      </main>
    </div>
  )

  if (!business) return notFound()

  // guard against empty working-hours so Object.entries never throws
  const wh = (business.workingHours ?? {}) as WorkingHours
  const openNow = isOpenNow(wh)
  const todayHours = getTodayHours(wh)
  const canBook = business.subscription?.status === 'ACTIVE' || business.subscription?.status === 'TRIAL'
  const mapQuery = encodeURIComponent(`${business.address}, ${business.district}, ${business.city}`)

  const TABS = [
    { key: 'overview',   label: 'Genel Bakış',                                    icon: Home },
    { key: 'services',   label: `Hizmetler (${business.services?.length ?? 0})`,  icon: LayoutGrid },
    { key: 'employees',  label: `Çalışanlar (${business.employees?.length ?? 0})`,icon: Users },
    { key: 'reviews',    label: `Yorumlar (${business.reviewCount})`,             icon: MessageCircle },
    { key: 'photos',     label: `Fotoğraflar (${business.gallery?.length ?? 0})`, icon: Camera },
  ]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', overflowX: 'hidden', maxWidth: '100vw' }}>
      <Header />

      {/* Breadcrumb */}
      <div className="bk-biz-breadcrumb" style={{ maxWidth: 1320, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-color)', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: 'var(--muted-color)', textDecoration: 'none' }}>Ana Sayfa</Link>
        <ChevronRight size={12} />
        <Link href={`/search?city=${business.city}`} style={{ color: 'var(--muted-color)', textDecoration: 'none' }}>{business.city}</Link>
        <ChevronRight size={12} />
        <Link href={`/search?city=${business.city}&district=${business.district}`} style={{ color: 'var(--muted-color)', textDecoration: 'none' }}>{business.district}</Link>
        <ChevronRight size={12} />
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{business.name}</span>
      </div>

      <main className="bk-salon-main" style={{ maxWidth: 1320, margin: '0 auto', padding: '0 20px 48px' }}>
        {/* Gallery */}
        {business.gallery?.length > 0 ? (
          <div className="bk-gallery-grid" style={{ display: 'grid', gap: 8, borderRadius: 20, overflow: 'hidden', marginBottom: 24 }}>
            {business.gallery.slice(0, 5).map((img: any, i: number) => (
              <div key={img.id} style={{ gridRow: i === 0 ? 'span 2' : 'auto', background: `url(${img.url}) center/cover`, backgroundColor: 'var(--surface-2)', position: 'relative' }}>
                {i === 4 && business.gallery.length > 5 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18 }}>
                    +{business.gallery.length - 5}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : business.coverImage ? (
          <div style={{ height: 300, background: `url(${business.coverImage}) center/cover`, borderRadius: 20, marginBottom: 24 }} />
        ) : (
          <div style={{ height: 220, background: 'linear-gradient(135deg, #f1ede6 0%, #e8e2d8 100%)', borderRadius: 20, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>✂️</div>
        )}

        <div className="bk-salon-layout" style={{ display: 'grid', gap: 24 }}>
          {/* Left */}
          <div>
            {/* Header card with tabs */}
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, marginBottom: 20, overflow: 'hidden' }}>
              <div className="bk-biz-header-pad" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: 'var(--surface-2)', color: 'var(--muted-color)' }}>
                      {categoryLabels[business.category as keyof typeof categoryLabels]}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, minWidth: 0 }}>
                      <h1 className="bk-biz-name" style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand)', margin: 0, wordBreak: 'break-word', minWidth: 0 }}>{business.name}</h1>
                      <CheckCircle2 size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    </div>
                    <div className="bk-biz-header-meta" style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 14, color: 'var(--muted-color)', marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#d69b22', fontWeight: 700 }}>
                        <Star size={14} fill="currentColor" /> {Number(business.rating).toFixed(1)}
                      </span>
                      <span>({business.reviewCount} yorum)</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: openNow ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
                        <span style={{ fontWeight: 700, color: openNow ? '#15803d' : '#b42318' }}>{openNow ? 'Açık' : 'Kapalı'}</span>
                        <span style={{ color: 'var(--muted-color)' }}>• {todayHours}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={14} /> {business.district}, {business.city}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={toggleFavorite}
                    style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--line)', background: favorited ? '#fee2e2' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Heart size={18} fill={favorited ? '#b42318' : 'none'} color={favorited ? '#b42318' : 'var(--text)'} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderTop: '1px solid var(--line)', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {TABS.map(t => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className="bk-tab-btn"
                      style={{
                        padding: '13px 16px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        color: tab === t.key ? 'var(--brand)' : 'var(--muted-color)',
                        background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? 'var(--brand)' : 'transparent'}`,
                        cursor: 'pointer', transition: 'all 0.15s', flex: 1,
                      }}
                    >
                      <span className="bk-tab-icon" style={{ display: 'none' }}><Icon size={18} /></span>
                      <span className="bk-tab-label">{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tab content */}

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <>
                {business.description && (
                  <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24, marginBottom: 20 }}>
                    <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>Hakkında</h2>
                    <p style={{ fontSize: 14, color: 'var(--muted-color)', lineHeight: 1.7 }}>{business.description}</p>
                  </div>
                )}
                {/* Top services preview */}
                {business.services?.length > 0 && (
                  <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Popüler Hizmetler</h2>
                      <button onClick={() => setTab('services')} style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer' }}>Tümü →</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {business.services.slice(0, 3).map((s: any) => (
                        <div key={s.id} className="bk-pub-svc-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 12, gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <User size={18} color="var(--muted-color)" />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 14, wordBreak: 'break-word' }}>{s.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 2 }}>{s.duration} dk</div>
                            </div>
                          </div>
                          <div style={{ fontWeight: 800, color: 'var(--brand)', flexShrink: 0 }}>{formatPrice(s.price)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Inline booking CTA */}
                {canBook && (
                  <Link href={`/booking?businessId=${business.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14, background: 'var(--brand)', color: 'white', fontWeight: 800, fontSize: 15, textDecoration: 'none', marginBottom: 20 }}>
                    <CalendarDays size={18} />
                    Randevu Oluştur
                  </Link>
                )}

                {/* Top employees preview */}
                {business.employees?.length > 0 && (
                  <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Çalışanlar</h2>
                      <button onClick={() => setTab('employees')} style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer' }}>Tümü →</button>
                    </div>
                    <div className="bk-emp-preview-grid" style={{ display: 'grid', gap: 10 }}>
                      {business.employees.slice(0, 4).map((emp: any) => (
                        <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 14 }}>
                          <div style={{ width: 42, height: 42, borderRadius: '50%', background: emp.photo ? `url(${emp.photo}) center/cover` : 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 16, flexShrink: 0 }}>
                            {!emp.photo && emp.name[0]}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, wordBreak: 'break-word' }}>{emp.name} {emp.surname}</div>
                            {emp.title && <div style={{ fontSize: 11, color: 'var(--muted-color)', wordBreak: 'break-word' }}>{emp.title}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Latest reviews */}
                {business.reviews?.length > 0 && (
                  <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Yorumlar</h2>
                      <button onClick={() => setTab('reviews')} style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer' }}>Tümü →</button>
                    </div>
                    {business.reviews.slice(0, 3).map((r: any) => (
                      <div key={r.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 14, marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{r.customer.name} {r.customer.surname}</span>
                          <span style={{ color: '#d69b22', fontWeight: 700 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                        </div>
                        {r.comment && <p style={{ fontSize: 13, color: 'var(--muted-color)', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* SERVICES */}
            {tab === 'services' && (
              <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
                <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Tüm Hizmetler</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {business.services?.map((s: any) => (
                    <div key={s.id} className="bk-pub-svc-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, border: '1px solid var(--line)', borderRadius: 14, gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={20} color="var(--muted-color)" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>{s.name}</div>
                          {s.description && <div style={{ fontSize: 13, color: 'var(--muted-color)', marginTop: 2, wordBreak: 'break-word' }}>{s.description}</div>}
                          <div style={{ fontSize: 13, color: 'var(--muted-color)', marginTop: 4 }}>{s.duration} dk</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 16 }}>{formatPrice(s.price)}</div>
                        {canBook && (
                          <Link href={`/booking?businessId=${business.id}&serviceId=${s.id}`} style={{ fontSize: 12, fontWeight: 700, color: 'white', background: 'var(--brand)', padding: '5px 12px', borderRadius: 8, textDecoration: 'none' }}>
                            Randevu Al
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                  {!business.services?.length && <p style={{ color: 'var(--muted-color)', fontSize: 14 }}>Henüz hizmet eklenmemiş.</p>}
                </div>
              </div>
            )}

            {/* EMPLOYEES */}
            {tab === 'employees' && (
              <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
                <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Çalışanlar</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {business.employees?.map((emp: any) => (
                    <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, border: '1px solid var(--line)', borderRadius: 16 }}>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', background: emp.photo ? `url(${emp.photo}) center/cover` : 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 22, flexShrink: 0 }}>
                        {!emp.photo && emp.name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, wordBreak: 'break-word' }}>{emp.name} {emp.surname}</div>
                        {emp.title && <div style={{ fontSize: 13, color: 'var(--muted-color)', wordBreak: 'break-word' }}>{emp.title}</div>}
                        {emp.services?.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            {emp.services.slice(0, 4).map((es: any) => (
                              <span key={es.id} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', background: 'var(--surface-2)', borderRadius: 6, color: 'var(--muted-color)' }}>
                                {es.service?.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(s => <Star key={s} size={12} fill="#d69b22" color="#d69b22" />)}
                      </div>
                    </div>
                  ))}
                  {!business.employees?.length && <p style={{ color: 'var(--muted-color)', fontSize: 14 }}>Henüz çalışan eklenmemiş.</p>}
                </div>
              </div>
            )}

            {/* REVIEWS */}
            {tab === 'reviews' && (
              <div>
                {/* Rating summary */}
                <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 52, fontWeight: 900, color: 'var(--brand)', lineHeight: 1 }}>{Number(business.rating).toFixed(1)}</div>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'center', margin: '6px 0' }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={16} fill={s <= Math.round(business.rating) ? '#d69b22' : '#e5e7eb'} color={s <= Math.round(business.rating) ? '#d69b22' : '#e5e7eb'} />)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>{business.reviewCount} yorum</div>
                  </div>
                </div>

                {/* Write review */}
                {session && (
                  <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
                    <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>Yorum Yaz</h3>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                      {[1,2,3,4,5].map(r => (
                        <button key={r} onClick={() => setReviewRating(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, color: r <= reviewRating ? '#d69b22' : '#e5e7eb', transition: 'color 0.1s' }}>★</button>
                      ))}
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="Deneyiminizi paylaşın..."
                      rows={3}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12 }}
                    />
                    <button onClick={submitReview} disabled={submittingReview} style={{ height: 44, padding: '0 24px', borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: submittingReview ? 'not-allowed' : 'pointer' }}>
                      {submittingReview ? 'Gönderiliyor...' : 'Yorum Gönder'}
                    </button>
                  </div>
                )}

                {/* Reviews list */}
                <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
                  {business.reviews?.map((r: any) => (
                    <div key={r.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 16, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{r.customer.name} {r.customer.surname}</span>
                        <span style={{ color: '#d69b22', fontWeight: 700 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                      </div>
                      {r.comment && <p style={{ fontSize: 13, color: 'var(--muted-color)', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
                    </div>
                  ))}
                  {!business.reviews?.length && <p style={{ color: 'var(--muted-color)', fontSize: 14 }}>Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>}
                </div>
              </div>
            )}

            {/* PHOTOS */}
            {tab === 'photos' && (
              <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
                <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Fotoğraflar</h2>
                {business.gallery?.length > 0 ? (
                  <div className="bk-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {business.gallery.map((img: any) => (
                      <div key={img.id} style={{ aspectRatio: '1', background: `url(${img.url}) center/cover`, backgroundColor: 'var(--surface-2)', borderRadius: 12 }} />
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--muted-color)', fontSize: 14 }}>Henüz fotoğraf eklenmemiş.</p>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="bk-salon-sidebar">
            {/* Book widget */}
            <div className="bk-salon-booking-widget" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: 16 }}>Randevu Al</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 20, maxWidth: '100%', overflow: 'hidden' }}>
                {['Hizmet','Çalışan','Saat','Onay'].map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? 'var(--brand)' : 'var(--surface-2)', color: i === 0 ? 'white' : 'var(--muted-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i+1}</div>
                      <span style={{ fontSize: 9, fontWeight: 600, color: i === 0 ? 'var(--brand)' : 'var(--muted-color)' }}>{s}</span>
                    </div>
                    {i < 3 && <div style={{ width: 24, height: 1.5, background: 'var(--line)', margin: '0 2px', marginTop: -14 }} />}
                  </div>
                ))}
              </div>
              {!canBook ? (
                <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, fontSize: 14, color: '#b42318' }}>
                  Bu işletme şu anda yeni randevu kabul etmiyor.
                </div>
              ) : (
                <Link href={`/booking?businessId=${business.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                  Randevu Oluştur
                </Link>
              )}
            </div>

            {/* Contact */}
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>İletişim</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--muted-color)' }}>
                <a href={`tel:${business.phone}`} style={{ display: 'flex', gap: 10, alignItems: 'center', textDecoration: 'none', color: 'var(--text)', fontWeight: 600, minWidth: 0 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Phone size={15} color="#15803d" /></span>
                  <span style={{ wordBreak: 'break-word', minWidth: 0 }}>{business.phone}</span>
                </a>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--muted-color)', minWidth: 0 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}><MapPin size={15} /></span>
                  <span style={{ wordBreak: 'break-word', minWidth: 0 }}>{business.address}, {business.district}, {business.city}</span>
                </div>
                {business.whatsapp && (
                  <a href={`https://wa.me/90${business.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 10, alignItems: 'center', textDecoration: 'none', color: 'var(--text)', fontWeight: 600, minWidth: 0 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </span>
                    WhatsApp&apos;tan Yaz
                  </a>
                )}
                {business.businessEmail && (
                  <a href={`mailto:${business.businessEmail}`} style={{ display: 'flex', gap: 10, alignItems: 'center', textDecoration: 'none', color: 'var(--text)', fontWeight: 600, minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Mail size={15} color="#1d4ed8" /></span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{business.businessEmail}</span>
                  </a>
                )}
                {business.instagram && (
                  <a href={`https://instagram.com/${business.instagram}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 10, alignItems: 'center', textDecoration: 'none', color: 'var(--text)', fontWeight: 600, minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>@{business.instagram}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Map */}
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '14px 20px 10px', fontWeight: 700, fontSize: 14 }}>Konum</div>
              <iframe src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&z=16`} width="100%" height="200" style={{ border: 0, display: 'block' }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <a href={`https://maps.google.com/maps?q=${mapQuery}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px 20px', fontSize: 12, color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
                Haritada Ara →
              </a>
            </div>

            {/* Working hours */}
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, marginBottom: 14, fontSize: 15 }}>Çalışma Saatleri</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(DAY_NAMES).map(([key, name]) => {
                  const h = wh[key]
                  const isToday = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()] === key
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: isToday ? 700 : 400 }}>
                      <span style={{ color: isToday ? 'var(--brand)' : 'var(--text)' }}>{name}{isToday ? ' (bugün)' : ''}</span>
                      <span style={{ color: h?.isOpen ? 'var(--green)' : '#b42318' }}>
                        {h?.isOpen ? `${h.open} - ${h.close}` : 'Kapalı'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Promo banner */}
            {canBook && (
              <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: '20px 24px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Scissors size={22} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.35 }}>Profesyonel bakım, mükemmel stil.</div>
                    <p style={{ fontSize: 13, color: 'var(--muted-color)', lineHeight: 1.5, margin: '4px 0 0' }}>Size en uygun hizmeti seçin, randevunuzu hemen oluşturun.</p>
                  </div>
                </div>
                <Link href={`/booking?businessId=${business.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 46, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  Randevu Oluştur
                </Link>
              </div>
            )}

            {/* Photo preview */}
            {business.gallery?.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>Fotoğraflar</h3>
                  <button onClick={() => setTab('photos')} style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer' }}>Tümü →</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {business.gallery.slice(0, 3).map((img: any) => (
                    <div key={img.id} style={{ aspectRatio: '1', background: `url(${img.url}) center/cover`, backgroundColor: 'var(--surface-2)', borderRadius: 10 }} />
                  ))}
                </div>
                {business.gallery.length > 3 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: i === 0 ? 18 : 6, height: 6, borderRadius: 99, background: i === 0 ? 'var(--brand)' : 'var(--line)', transition: 'width 0.2s' }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
