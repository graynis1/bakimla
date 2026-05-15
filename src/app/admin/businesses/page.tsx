'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { categoryLabels } from '@/lib/utils'
import { Check, X, Eye, Pencil, Trash2, Plus, KeyRound } from 'lucide-react'
import type { BusinessCategory } from '@/generated/prisma'
import { cityList, getDistricts } from '@/lib/locations'
import ImageUpload from '@/components/ui/ImageUpload'

const CATEGORIES = Object.entries(categoryLabels) as [BusinessCategory, string][]

interface Owner { id: string; name: string; surname: string; email: string }
interface Business {
  id: string; name: string; slug: string; category: BusinessCategory
  city: string; district: string; phone: string; address: string
  description: string | null; coverImage: string | null
  status: string; createdAt: string; ownerId: string
  owner: Owner
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Beklemede',    color: '#92400e', bg: '#fef3c7' },
  APPROVED:  { label: 'Onaylandı',    color: '#15803d', bg: '#f0fdf4' },
  REJECTED:  { label: 'Reddedildi',   color: '#b42318', bg: '#fee2e2' },
  SUSPENDED: { label: 'Askıya Alındı',color: '#6b7280', bg: '#f3f4f6' },
}

const emptyForm = { name: '', category: 'HAIR_SALON' as BusinessCategory, city: '', district: '', phone: '', address: '', description: '', coverImage: '', ownerId: '', status: 'PENDING' }

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'pw' | null>(null)
  const [selected, setSelected] = useState<Business | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [owners, setOwners] = useState<Owner[]>([])
  const [newPw, setNewPw] = useState('')

  useEffect(() => { fetchBusinesses() }, [filter])

  async function fetchBusinesses() {
    setLoading(true)
    const res = await fetch(`/api/admin/businesses?status=${filter}`)
    const data = await res.json()
    if (data.success) setBusinesses(data.data)
    setLoading(false)
  }

  async function fetchOwners() {
    const res = await fetch('/api/admin/users?role=SALON_OWNER')
    const data = await res.json()
    if (data.success) setOwners(data.data)
  }

  function openCreate() {
    setForm(emptyForm)
    fetchOwners()
    setModal('create')
  }

  function openEdit(b: Business) {
    setSelected(b)
    setForm({ name: b.name, category: b.category, city: b.city, district: b.district, phone: b.phone, address: b.address, description: b.description ?? '', coverImage: b.coverImage ?? '', ownerId: b.ownerId, status: b.status })
    fetchOwners()
    setModal('edit')
  }

  function openDelete(b: Business) { setSelected(b); setModal('delete') }
  function openPw(b: Business) { setSelected(b); setNewPw(''); setModal('pw') }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      const data = await res.json()
      if (data.success) { toast.success('Durum güncellendi'); fetchBusinesses() }
      else toast.error(data.error)
    } finally { setUpdating(null) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const url = modal === 'create' ? '/api/admin/businesses' : `/api/admin/businesses/${selected!.id}`
      const method = modal === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (data.success) {
        toast.success(modal === 'create' ? 'İşletme oluşturuldu' : 'İşletme güncellendi')
        setModal(null)
        fetchBusinesses()
      } else toast.error(data.error)
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/businesses/${selected!.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { toast.success('İşletme silindi'); setModal(null); fetchBusinesses() }
      else toast.error(data.error)
    } finally { setSaving(false) }
  }

  async function handlePwReset() {
    if (!newPw || newPw.length < 6) { toast.error('Şifre en az 6 karakter olmalı'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${selected!.ownerId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword: newPw }) })
      const data = await res.json()
      if (data.success) { toast.success('Şifre güncellendi'); setModal(null) }
      else toast.error(data.error)
    } finally { setSaving(false) }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 5, color: 'var(--text)' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>İşletmeler</h1>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px', borderRadius: 10, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 13, border: 0, cursor: 'pointer' }}>
          <Plus size={15} /> Yeni İşletme
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, border: `1px solid ${filter === s ? 'var(--brand)' : 'var(--line)'}`, background: filter === s ? 'var(--brand)' : 'white', color: filter === s ? 'white' : 'var(--text)', cursor: 'pointer' }}>
            {s === 'all' ? 'Tümü' : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map((i) => <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 14, height: 80 }} className="animate-pulse" />)}
        </div>
      ) : businesses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-color)', fontSize: 14 }}>Bu durumda işletme bulunamadı.</div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
          {businesses.map((b) => {
            const st = STATUS_CONFIG[b.status]
            return (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--line)', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{b.name}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color, fontWeight: 700, whiteSpace: 'nowrap' }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted-color)' }}>
                    {categoryLabels[b.category as BusinessCategory]} • {b.city}, {b.district}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 1 }}>
                    Sahip: {b.owner.name} {b.owner.surname} ({b.owner.email}) • {format(new Date(b.createdAt), 'd MMM yyyy', { locale: tr })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Link href={`/salon/${b.slug}`} target="_blank" title="Görüntüle" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--text)' }}>
                    <Eye size={14} />
                  </Link>
                  <button onClick={() => openEdit(b)} title="Düzenle" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => openPw(b)} title="Şifre Sıfırla" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                    <KeyRound size={14} />
                  </button>
                  <button onClick={() => openDelete(b)} title="Sil" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b42318' }}>
                    <Trash2 size={14} />
                  </button>
                  {b.status === 'PENDING' && (
                    <>
                      <button onClick={() => updateStatus(b.id, 'APPROVED')} disabled={updating === b.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', border: '1px solid #86efac', borderRadius: 8, background: 'white', color: '#15803d', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                        <Check size={12} /> Onayla
                      </button>
                      <button onClick={() => updateStatus(b.id, 'REJECTED')} disabled={updating === b.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', border: '1px solid #fecaca', borderRadius: 8, background: 'white', color: '#b42318', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                        <X size={12} /> Reddet
                      </button>
                    </>
                  )}
                  {b.status === 'APPROVED' && (
                    <button onClick={() => updateStatus(b.id, 'SUSPENDED')} disabled={updating === b.id} style={{ padding: '5px 12px', border: '1px solid var(--line)', borderRadius: 8, background: 'white', color: 'var(--muted-color)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      Askıya Al
                    </button>
                  )}
                  {(b.status === 'REJECTED' || b.status === 'SUSPENDED') && (
                    <button onClick={() => updateStatus(b.id, 'APPROVED')} disabled={updating === b.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', border: '1px solid #86efac', borderRadius: 8, background: 'white', color: '#15803d', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      <Check size={12} /> Aktifleştir
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setModal(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: 'var(--brand)' }}>
              {modal === 'create' ? 'Yeni İşletme Ekle' : 'İşletme Düzenle'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>İşletme Adı</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} placeholder="Kemal Kuaför" required />
                </div>
                <div>
                  <label style={lbl}>Kategori</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as BusinessCategory })} style={inp}>
                    {CATEGORIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>İşletme Sahibi</label>
                <select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} style={inp}>
                  <option value="">-- Seçin --</option>
                  {owners.map((o) => <option key={o.id} value={o.id}>{o.name} {o.surname} ({o.email})</option>)}
                </select>
              </div>
              <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Şehir</label>
                  <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, district: '' })} style={inp}>
                    <option value="">Seçin</option>
                    {cityList.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>İlçe</label>
                  <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} style={inp} disabled={!form.city}>
                    <option value="">Seçin</option>
                    {getDistricts(form.city).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Telefon</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} placeholder="0212..." />
                </div>
                <div>
                  <label style={lbl}>Durum</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inp}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Adres</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inp} placeholder="Atatürk Cad. No:1" />
              </div>
              <div>
                <ImageUpload
                  label="Kapak Fotoğrafı"
                  value={form.coverImage}
                  onChange={(url) => setForm({ ...form, coverImage: url })}
                  height={160}
                />
              </div>
              <div>
                <label style={lbl}>Açıklama</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inp, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--line)', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>İptal</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', borderRadius: 10, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setModal(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#b42318' }}>İşletmeyi Sil</h2>
            <p style={{ fontSize: 14, color: 'var(--muted-color)', marginBottom: 6 }}>
              <strong>{selected.name}</strong> işletmesini kalıcı olarak silmek istediğinizden emin misiniz?
            </p>
            <p style={{ fontSize: 13, color: '#b42318', marginBottom: 20 }}>Bu işlem geri alınamaz. Tüm randevu, ödeme ve yorumlar da silinir.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--line)', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>İptal</button>
              <button onClick={handleDelete} disabled={saving} style={{ padding: '9px 20px', borderRadius: 10, background: '#b42318', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {modal === 'pw' && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setModal(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: 'var(--brand)' }}>Şifre Sıfırla</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 20 }}>
              <strong>{selected.owner.name} {selected.owner.surname}</strong> ({selected.owner.email}) için yeni şifre
            </p>
            <label style={lbl}>Yeni Şifre</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={{ ...inp, marginBottom: 20 }} placeholder="En az 6 karakter" />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--line)', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>İptal</button>
              <button onClick={handlePwReset} disabled={saving} style={{ padding: '9px 20px', borderRadius: 10, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
