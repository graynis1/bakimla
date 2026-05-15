'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Save } from 'lucide-react'
import { toast } from 'sonner'
import ImageUpload from '@/components/ui/ImageUpload'

interface Campaign {
  id: string
  title: string
  description: string | null
  code: string | null
  discount: number | null
  imageUrl: string | null
  isActive: boolean
  startDate: string | null
  endDate: string | null
}

const EMPTY: Omit<Campaign, 'id'> = {
  title: '', description: '', code: '', discount: null,
  imageUrl: '', isActive: true, startDate: '', endDate: '',
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; editing: Campaign | null }>({ open: false, editing: null })
  const [form, setForm] = useState<Omit<Campaign, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/campaigns')
    if (res.ok) setCampaigns(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm(EMPTY)
    setModal({ open: true, editing: null })
  }

  function openEdit(c: Campaign) {
    setForm({
      title: c.title, description: c.description ?? '', code: c.code ?? '',
      discount: c.discount, imageUrl: c.imageUrl ?? '', isActive: c.isActive,
      startDate: c.startDate ? c.startDate.slice(0, 10) : '',
      endDate: c.endDate ? c.endDate.slice(0, 10) : '',
    })
    setModal({ open: true, editing: c })
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Başlık zorunludur'); return }
    setSaving(true)
    const url = modal.editing ? `/api/admin/campaigns/${modal.editing.id}` : '/api/admin/campaigns'
    const method = modal.editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) {
      toast.success(modal.editing ? 'Güncellendi' : 'Kampanya eklendi')
      setModal({ open: false, editing: null })
      load()
    } else toast.error('İşlem başarısız')
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" kampanyasını silmek istediğinize emin misiniz?`)) return
    const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Kampanya silindi'); load() }
    else toast.error('Silinemedi')
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', margin: 0 }}>Kampanyalar</h1>
        <button onClick={openNew} style={{ height: 42, padding: '0 20px', borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Yeni Kampanya
        </button>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-color)' }}>Yükleniyor...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <p style={{ color: 'var(--muted-color)', fontSize: 15, marginBottom: 16 }}>Henüz kampanya yok.</p>
            <button onClick={openNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: 'pointer' }}>
              <Plus size={16} /> İlk Kampanyayı Ekle
            </button>
          </div>
        ) : (
          <div className="bk-table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}>
                  {['Kampanya', 'İndirim', 'Kod', 'Bitiş', 'Durum', 'İşlemler'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--muted-color)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.title}</div>
                      {c.description && <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 2 }}>{c.description.slice(0, 60)}{c.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {c.discount ? <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--danger)' }}>%{c.discount}</span> : <span style={{ color: 'var(--muted-color)' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {c.code ? <code style={{ background: 'var(--gold-soft)', color: 'var(--gold)', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>{c.code}</code> : <span style={{ color: 'var(--muted-color)' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--muted-color)' }}>
                      {c.endDate ? new Date(c.endDate).toLocaleDateString('tr-TR') : 'Sınırsız'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: c.isActive ? '#dcfce7' : '#fee2e2', color: c.isActive ? '#16a34a' : '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {c.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                        {c.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(c)} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(c.id, c.title)} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #fecaca', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000 }} onClick={() => setModal({ open: false, editing: null })} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'white', borderRadius: 24, padding: 32, width: '90%', maxWidth: 560, zIndex: 1001, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: 18, margin: 0 }}>{modal.editing ? 'Kampanyayı Düzenle' : 'Yeni Kampanya'}</h2>
              <button onClick={() => setModal({ open: false, editing: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Başlık *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="Kampanya başlığı" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Açıklama</label>
                <textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Kampanya detayları" />
              </div>
              <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>İndirim Oranı (%)</label>
                  <input type="number" min="1" max="100" value={form.discount ?? ''} onChange={(e) => setForm({ ...form, discount: e.target.value ? parseInt(e.target.value) : null })} style={inputStyle} placeholder="20" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>İndirim Kodu</label>
                  <input value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} style={inputStyle} placeholder="BAKIMLA20" />
                </div>
              </div>
              <div>
                <ImageUpload
                  label="Görsel"
                  value={form.imageUrl ?? ''}
                  onChange={(url) => setForm({ ...form, imageUrl: url })}
                />
              </div>
              <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Başlangıç Tarihi</label>
                  <input type="date" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Bitiş Tarihi</label>
                  <input type="date" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--brand)' }} />
                Aktif (siteye yansır)
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal({ open: false, editing: null })} style={{ height: 42, padding: '0 20px', borderRadius: 12, border: '1px solid var(--line)', background: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>İptal</button>
              <button onClick={handleSave} disabled={saving} style={{ height: 42, padding: '0 24px', borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={15} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
