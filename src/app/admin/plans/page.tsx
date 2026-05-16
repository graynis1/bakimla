'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Edit2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface PlanFeatures {
  hasGallery?: boolean
  maxGallery?: number | null
  canHideReviews?: boolean
  displayList?: string[]
}

interface Plan {
  id: string
  name: string
  maxEmployees: number
  monthlyPrice: number
  yearlyPrice: number
  features: PlanFeatures | string[]
  isActive: boolean
}

interface PlanForm {
  name: string
  maxEmployees: string
  monthlyPrice: string
  yearlyPrice: string
  hasGallery: boolean
  maxGallery: string
  canHideReviews: boolean
  displayList: string
}

const EMPTY: PlanForm = {
  name: '', maxEmployees: '', monthlyPrice: '', yearlyPrice: '',
  hasGallery: true, maxGallery: '', canHideReviews: true, displayList: '',
}

function parseFeaturesForForm(features: PlanFeatures | string[]): Pick<PlanForm, 'hasGallery' | 'maxGallery' | 'canHideReviews' | 'displayList'> {
  if (Array.isArray(features)) {
    return { hasGallery: true, maxGallery: '', canHideReviews: true, displayList: features.join(', ') }
  }
  const f = features ?? {}
  return {
    hasGallery: f.hasGallery !== false,
    maxGallery: f.maxGallery ? String(f.maxGallery) : '',
    canHideReviews: f.canHideReviews !== false,
    displayList: Array.isArray(f.displayList) ? f.displayList.join(', ') : '',
  }
}

function getDisplayList(p: Plan): string[] {
  if (Array.isArray(p.features)) return p.features
  return p.features?.displayList ?? []
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm] = useState<PlanForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchPlans() }, [])

  async function fetchPlans() {
    const res = await fetch('/api/admin/plans')
    const data = await res.json()
    if (data.success) setPlans(data.data)
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setShowModal(true)
  }

  function openEdit(p: Plan) {
    setEditing(p)
    setForm({
      name: p.name,
      maxEmployees: String(p.maxEmployees),
      monthlyPrice: String(p.monthlyPrice),
      yearlyPrice: String(p.yearlyPrice),
      ...parseFeaturesForForm(p.features),
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/admin/plans/${editing.id}` : '/api/admin/plans'
      const features: PlanFeatures = {
        hasGallery: form.hasGallery,
        maxGallery: form.maxGallery ? Number(form.maxGallery) : null,
        canHideReviews: form.canHideReviews,
        displayList: form.displayList.split(',').map((f) => f.trim()).filter(Boolean),
      }
      const payload = {
        name: form.name,
        maxEmployees: Number(form.maxEmployees),
        monthlyPrice: Number(form.monthlyPrice),
        yearlyPrice: Number(form.yearlyPrice),
        features,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editing ? 'Plan güncellendi' : 'Plan eklendi')
        setShowModal(false)
        fetchPlans()
      } else toast.error(data.error)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(p: Plan) {
    const res = await fetch(`/api/admin/plans/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    })
    const data = await res.json()
    if (data.success) { toast.success('Plan güncellendi'); fetchPlans() }
    else toast.error(data.error)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }

  const ToggleRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--brand)' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20,
          borderRadius: '50%', background: 'white', transition: 'left 0.2s', display: 'block',
        }} />
      </button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Abonelik Planları</h1>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', border: 0, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          <Plus size={16} /> Plan Ekle
        </button>
      </div>

      {loading ? (
        <div className="bk-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[1,2,3].map((i) => <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, height: 200 }} className="animate-pulse" />)}
        </div>
      ) : (
        <div className="bk-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {plans.map((p) => {
            const f = Array.isArray(p.features) ? {} : (p.features ?? {}) as PlanFeatures
            const hasGallery = f.hasGallery !== false
            const maxGallery = f.maxGallery ?? null
            const canHideReviews = f.canHideReviews !== false
            const displayList = getDisplayList(p)
            return (
              <div key={p.id} style={{ background: 'white', border: `1px solid ${p.isActive ? 'var(--line)' : '#fecaca'}`, borderRadius: 20, padding: 20, opacity: p.isActive ? 1 : 0.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h3 style={{ fontWeight: 800, fontSize: 18 }}>{p.name}</h3>
                  {!p.isActive && <span style={{ fontSize: 11, color: '#b42318', background: '#fee2e2', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>Pasif</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 6 }}>Maks. {p.maxEmployees} çalışan</div>
                <div style={{ marginBottom: 4 }}><span style={{ fontWeight: 800, fontSize: 18 }}>{formatPrice(p.monthlyPrice)}</span><span style={{ fontSize: 12, color: 'var(--muted-color)' }}>/ay</span></div>
                <div style={{ marginBottom: 12 }}><span style={{ fontWeight: 700, fontSize: 15 }}>{formatPrice(p.yearlyPrice)}</span><span style={{ fontSize: 12, color: 'var(--muted-color)' }}>/yıl</span></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 700, background: hasGallery ? '#f0fdf4' : '#fee2e2', color: hasGallery ? '#15803d' : '#b42318' }}>
                    {hasGallery ? (maxGallery ? `Galeri (${maxGallery})` : 'Galeri ∞') : 'Galeri yok'}
                  </span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 700, background: canHideReviews ? '#f0fdf4' : '#fee2e2', color: canHideReviews ? '#15803d' : '#b42318' }}>
                    {canHideReviews ? 'Yorum gizleme ✓' : 'Yorum gizleme ✗'}
                  </span>
                </div>
                {displayList.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    {displayList.map((item, i) => <div key={i} style={{ fontSize: 12, color: 'var(--muted-color)', padding: '2px 0' }}>• {item}</div>)}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(p)} style={{ flex: 1, height: 36, border: '1px solid var(--line)', borderRadius: 10, background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Edit2 size={13} /> Düzenle
                  </button>
                  <button onClick={() => toggleActive(p)} style={{ flex: 1, height: 36, border: `1px solid ${p.isActive ? '#fecaca' : '#86efac'}`, borderRadius: 10, background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: p.isActive ? '#b42318' : '#15803d' }}>
                    {p.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: 20, fontSize: 18 }}>{editing ? 'Planı Düzenle' : 'Yeni Plan'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Plan Adı</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Maks. Çalışan</label>
                <input type="number" value={form.maxEmployees} onChange={(e) => setForm({ ...form, maxEmployees: e.target.value })} style={inputStyle} min="1" />
              </div>
              <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Aylık Fiyat (₺)</label>
                  <input type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })} style={inputStyle} min="0" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Yıllık Fiyat (₺)</label>
                  <input type="number" value={form.yearlyPrice} onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })} style={inputStyle} min="0" />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: 'var(--brand)' }}>Özellik Kısıtları</div>
                <ToggleRow label="Galeri erişimi" checked={form.hasGallery} onChange={(v) => setForm({ ...form, hasGallery: v })} />
                {form.hasGallery && (
                  <div style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      Maks. galeri fotoğraf sayısı <span style={{ color: 'var(--muted-color)', fontWeight: 400 }}>(boş = sınırsız)</span>
                    </label>
                    <input
                      type="number"
                      value={form.maxGallery}
                      onChange={(e) => setForm({ ...form, maxGallery: e.target.value })}
                      style={{ ...inputStyle, width: 160 }}
                      min="1"
                      placeholder="Sınırsız"
                    />
                  </div>
                )}
                <ToggleRow label="Yorum gizleme" checked={form.canHideReviews} onChange={(v) => setForm({ ...form, canHideReviews: v })} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Görünür özellik listesi <span style={{ color: 'var(--muted-color)', fontWeight: 400 }}>(virgülle ayırın)</span>
                </label>
                <textarea value={form.displayList} onChange={(e) => setForm({ ...form, displayList: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Online randevu, SMS bildirimi, ..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, height: 44, border: '1px solid var(--line)', borderRadius: 12, background: 'white', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, height: 44, border: 0, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
