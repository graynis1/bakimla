'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Trash2, Upload, Loader2, Lock } from 'lucide-react'

interface GalleryItem {
  id: string
  url: string
  caption?: string | null
  sortOrder: number
}

interface LimitInfo {
  hasGallery: boolean
  maxGallery: number | null
  currentGalleryCount: number
  planName: string | null
}

export default function SalonGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState<LimitInfo | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pendingUrl, setPendingUrl] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetchGallery(); fetchLimit() }, [])

  async function fetchLimit() {
    const res = await fetch('/api/salon/subscription-limit')
    const data = await res.json()
    if (data.success) setLimit(data.data)
  }

  async function fetchGallery() {
    const res = await fetch('/api/salon/gallery')
    const data = await res.json()
    if (data.success) setItems(data.data)
    setLoading(false)
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        setPendingUrl(data.url)
      } else {
        toast.error(data.error || 'Yükleme başarısız')
      }
    } catch {
      toast.error('Bağlantı hatası')
    } finally {
      setUploading(false)
    }
  }

  async function addItem() {
    if (!pendingUrl) return
    setAdding(true)
    try {
      const res = await fetch('/api/salon/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pendingUrl, caption: caption.trim() || null }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Fotoğraf eklendi')
        setPendingUrl('')
        setCaption('')
        fetchGallery()
        fetchLimit()
      } else {
        toast.error(data.error)
      }
    } finally {
      setAdding(false)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Bu fotoğrafı silmek istediğinizden emin misiniz?')) return
    const res = await fetch(`/api/salon/gallery/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      toast.success('Fotoğraf silindi')
      fetchGallery()
      fetchLimit()
    } else toast.error(data.error || 'Fotoğraf silinemedi')
  }

  const atLimit = !!(limit?.maxGallery && limit.maxGallery > 0 && items.length >= limit.maxGallery)

  if (limit && !limit.hasGallery) {
    return (
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', marginBottom: 20 }}>Galeri</h1>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 20, padding: 40, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={28} color="#f97316" />
          </div>
          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, color: '#c2410c' }}>Galeri bu pakette mevcut değil</div>
          <p style={{ fontSize: 14, color: '#9a3412', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
            Müşterilerinize fotoğraflarınızı göstermek için daha üst bir pakete geçin.
          </p>
          <a
            href="/salon/subscription"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#f97316', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
          >
            Üst Pakete Geç
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Galeri</h1>
        {limit?.maxGallery && limit.maxGallery > 0 ? (
          <span style={{ fontSize: 13, color: atLimit ? '#b42318' : 'var(--muted-color)', fontWeight: 700, background: atLimit ? '#fee2e2' : 'var(--surface-2)', padding: '4px 12px', borderRadius: 99 }}>
            {items.length} / {limit.maxGallery} fotoğraf
          </span>
        ) : null}
      </div>

      {atLimit && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Lock size={20} color="#f97316" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#c2410c' }}>Galeri limitinize ulaştınız ({limit?.maxGallery} fotoğraf)</div>
            <div style={{ fontSize: 13, color: '#9a3412', marginTop: 2 }}>
              Daha fazla fotoğraf eklemek için{' '}
              <a href="/salon/subscription" style={{ color: '#f97316', fontWeight: 700, textDecoration: 'none' }}>üst pakete geçin</a>.
            </div>
          </div>
        </div>
      )}

      {!atLimit && (
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>Fotoğraf Ekle</h2>

          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, border: '2px dashed var(--line)', borderRadius: 14, padding: 28,
            cursor: uploading ? 'wait' : 'pointer', background: 'var(--surface-2)', marginBottom: 12,
            position: 'relative', overflow: 'hidden',
          }}>
            {pendingUrl ? (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <img src={pendingUrl} alt="" style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 10, objectFit: 'cover', marginBottom: 8 }} />
                <div style={{ fontSize: 13, color: 'var(--muted-color)' }}>Fotoğraf yüklendi — açıklama ekleyip kaydedin</div>
              </div>
            ) : uploading ? (
              <>
                <Loader2 size={28} color="var(--brand)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, color: 'var(--muted-color)' }}>Yükleniyor...</span>
              </>
            ) : (
              <>
                <Upload size={28} color="var(--brand)" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Fotoğraf Seç veya Sürükle</span>
                <span style={{ fontSize: 12, color: 'var(--muted-color)' }}>JPEG, PNG, WebP · Maks 5MB</span>
              </>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={handleFileSelect} disabled={uploading} />
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Açıklama (isteğe bağlı)"
              style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14 }}
            />
            <button
              onClick={addItem}
              disabled={adding || !pendingUrl}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 20px', border: 0, borderRadius: 12, background: pendingUrl ? 'var(--brand)' : 'var(--line)', color: 'white', fontWeight: 700, fontSize: 14, cursor: !pendingUrl ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: !pendingUrl ? 0.5 : 1 }}
            >
              Galeriye Ekle
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bk-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[1,2,3,4,5,6].map((i) => <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 14, height: 180 }} className="animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-color)', fontSize: 14 }}>Henüz fotoğraf eklenmemiş.</div>
      ) : (
        <div className="bk-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {items.map((item) => (
            <div key={item.id} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--line)' }}>
              <div style={{ height: 180, background: `url(${item.url}) center/cover`, backgroundColor: 'var(--surface-2)' }} />
              {item.caption && (
                <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--muted-color)', background: 'white' }}>{item.caption}</div>
              )}
              <button
                onClick={() => deleteItem(item.id)}
                style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
