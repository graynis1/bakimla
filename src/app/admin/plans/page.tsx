'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  maxEmployees: number
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  isActive: boolean
}

interface PlanForm {
  name: string
  maxEmployees: string
  monthlyPrice: string
  yearlyPrice: string
  features: string
}

const EMPTY: PlanForm = { name: '', maxEmployees: '', monthlyPrice: '', yearlyPrice: '', features: '' }

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
      features: Array.isArray(p.features) ? p.features.join(', ') : '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/admin/plans/${editing.id}` : '/api/admin/plans'
      const payload = {
        name: form.name,
        maxEmployees: Number(form.maxEmployees),
        monthlyPrice: Number(form.monthlyPrice),
        yearlyPrice: Number(form.yearlyPrice),
        features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
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
          {plans.map((p) => (
            <div key={p.id} style={{ background: 'white', border: `1px solid ${p.isActive ? 'var(--line)' : '#fecaca'}`, borderRadius: 20, padding: 20, opacity: p.isActive ? 1 : 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontWeight: 800, fontSize: 18 }}>{p.name}</h3>
                {!p.isActive && <span style={{ fontSize: 11, color: '#b42318', background: '#fee2e2', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>Pasif</span>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 8 }}>Maks. {p.maxEmployees} çalışan</div>
              <div style={{ marginBottom: 4 }}><span style={{ fontWeight: 800, fontSize: 18 }}>{formatPrice(p.monthlyPrice)}</span><span style={{ fontSize: 12, color: 'var(--muted-color)' }}>/ay</span></div>
              <div style={{ marginBottom: 14 }}><span style={{ fontWeight: 700, fontSize: 15 }}>{formatPrice(p.yearlyPrice)}</span><span style={{ fontSize: 12, color: 'var(--muted-color)' }}>/yıl</span></div>
              {Array.isArray(p.features) && p.features.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  {p.features.map((f, i) => <div key={i} style={{ fontSize: 12, color: 'var(--muted-color)', padding: '2px 0' }}>• {f}</div>)}
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
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 480, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: 20, fontSize: 18 }}>{editing ? 'Planı Düzenle' : 'Yeni Plan'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Özellikler (virgülle ayırın)</label>
                <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Online randevu, SMS bildirimi, ..." />
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
