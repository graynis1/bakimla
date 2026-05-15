'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Service {
  id: string
  name: string
  description?: string | null
  duration: number
  price: number
  isActive: boolean
  sortOrder: number
}

interface ServiceForm {
  name: string
  description: string
  duration: string
  price: string
}

const EMPTY: ServiceForm = { name: '', description: '', duration: '30', price: '' }

export default function SalonServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<ServiceForm>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchServices() }, [])

  async function fetchServices() {
    const res = await fetch('/api/salon/services')
    const data = await res.json()
    if (data.success) setServices(data.data)
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setShowModal(true)
  }

  function openEdit(s: Service) {
    setEditing(s)
    setForm({ name: s.name, description: s.description || '', duration: String(s.duration), price: String(s.price) })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name || !form.price) return
    setSaving(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/salon/services/${editing.id}` : '/api/salon/services'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duration: Number(form.duration), price: Number(form.price) }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editing ? 'Hizmet güncellendi' : 'Hizmet eklendi')
        setShowModal(false)
        fetchServices()
      } else toast.error(data.error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) return
    const res = await fetch(`/api/salon/services/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) { toast.success('Hizmet silindi'); fetchServices() }
    else toast.error(data.error)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Hizmetler</h1>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', border: 0, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          <Plus size={16} /> Hizmet Ekle
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map((i) => <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16, height: 70 }} className="animate-pulse" />)}
        </div>
      ) : services.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-color)', fontSize: 14 }}>Henüz hizmet eklenmemiş.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {services.map((s) => (
            <div key={s.id} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</span>
                  {!s.isActive && <span style={{ fontSize: 11, color: '#b42318', fontWeight: 700 }}>Pasif</span>}
                </div>
                {s.description && <div style={{ fontSize: 13, color: 'var(--muted-color)', marginTop: 2 }}>{s.description}</div>}
                <div style={{ fontSize: 13, color: 'var(--muted-color)', marginTop: 4 }}>⏱ {s.duration} dk</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 16 }}>{formatPrice(s.price)}</span>
                <button onClick={() => openEdit(s)} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(s.id)} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #fecaca', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b42318' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 460, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: 20, fontSize: 18 }}>{editing ? 'Hizmeti Düzenle' : 'Yeni Hizmet'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Hizmet Adı</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Açıklama</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Süre (dk)</label>
                  <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} style={inputStyle}>
                    {[15,20,30,45,60,75,90,120,150,180].map((d) => <option key={d} value={d}>{d} dk</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Fiyat (₺)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} min="0" step="0.5" required />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, height: 44, border: '1px solid var(--line)', borderRadius: 12, background: 'white', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.price} style={{ flex: 1, height: 44, border: 0, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
