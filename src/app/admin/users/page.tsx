'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, KeyRound, Store } from 'lucide-react'

interface Business { id: string; name: string; status: string }
interface User {
  id: string; name: string; surname: string; email: string
  phone: string | null; role: string; isActive: boolean; createdAt: string
  _count: { appointments: number; reviews: number }
  businesses: Business[]
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CUSTOMER:    { label: 'Müşteri',       color: '#1d4ed8', bg: '#eff6ff' },
  SALON_OWNER: { label: 'İşletme Sahibi',color: '#7e22ce', bg: '#faf5ff' },
  ADMIN:       { label: 'Admin',          color: '#b42318', bg: '#fee2e2' },
}

const emptyForm = { name: '', surname: '', email: '', phone: '', role: 'CUSTOMER', isActive: true, password: '' }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('all')

  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'pw' | null>(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [newPw, setNewPw] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchUsers() }, [roleFilter])

  async function fetchUsers() {
    setLoading(true)
    const res = await fetch(`/api/admin/users?role=${roleFilter}`)
    const data = await res.json()
    if (data.success) setUsers(data.data)
    setLoading(false)
  }

  function openCreate() { setForm(emptyForm); setModal('create') }
  function openEdit(u: User) {
    setSelected(u)
    setForm({ name: u.name, surname: u.surname, email: u.email, phone: u.phone ?? '', role: u.role, isActive: u.isActive, password: '' })
    setModal('edit')
  }
  function openDelete(u: User) { setSelected(u); setModal('delete') }
  function openPw(u: User) { setSelected(u); setNewPw(''); setModal('pw') }

  async function handleSave() {
    setSaving(true)
    try {
      if (modal === 'create') {
        if (!form.password || form.password.length < 6) { toast.error('Şifre en az 6 karakter olmalı'); return }
        const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const data = await res.json()
        if (data.success) { toast.success('Kullanıcı oluşturuldu'); setModal(null); fetchUsers() }
        else toast.error(data.error)
      } else {
        const payload: Record<string, unknown> = { name: form.name, surname: form.surname, email: form.email, phone: form.phone, role: form.role, isActive: form.isActive }
        if (form.password) payload.newPassword = form.password
        const res = await fetch(`/api/admin/users/${selected!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const data = await res.json()
        if (data.success) { toast.success('Kullanıcı güncellendi'); setModal(null); fetchUsers() }
        else toast.error(data.error)
      }
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${selected!.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { toast.success('Kullanıcı silindi'); setModal(null); fetchUsers() }
      else toast.error(data.error)
    } finally { setSaving(false) }
  }

  async function handlePwReset() {
    if (!newPw || newPw.length < 6) { toast.error('Şifre en az 6 karakter olmalı'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${selected!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword: newPw }) })
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
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Kullanıcılar</h1>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px', borderRadius: 10, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 13, border: 0, cursor: 'pointer' }}>
          <Plus size={15} /> Yeni Kullanıcı
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', 'CUSTOMER', 'SALON_OWNER', 'ADMIN'] as const).map((r) => (
          <button key={r} onClick={() => setRoleFilter(r)} style={{ padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, border: `1px solid ${roleFilter === r ? 'var(--brand)' : 'var(--line)'}`, background: roleFilter === r ? 'var(--brand)' : 'white', color: roleFilter === r ? 'white' : 'var(--text)', cursor: 'pointer' }}>
            {r === 'all' ? `Tümü (${users.length})` : ROLE_CONFIG[r].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4].map((i) => <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 14, height: 70 }} className="animate-pulse" />)}
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-color)', fontSize: 14 }}>Kullanıcı bulunamadı.</div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
          {users.map((u) => {
            const rc = ROLE_CONFIG[u.role]
            return (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--line)', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{u.name} {u.surname}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: rc.bg, color: rc.color, fontWeight: 700 }}>{rc.label}</span>
                    {!u.isActive && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#f3f4f6', color: '#6b7280', fontWeight: 700 }}>Pasif</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted-color)' }}>{u.email}{u.phone ? ` • ${u.phone}` : ''}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 1, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>{u._count.appointments} randevu • {u._count.reviews} yorum</span>
                    {u.businesses.length > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Store size={11} />
                        {u.businesses.map((b) => b.name).join(', ')}
                      </span>
                    )}
                    <span>{format(new Date(u.createdAt), 'd MMM yyyy', { locale: tr })}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <button onClick={() => openEdit(u)} title="Düzenle" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => openPw(u)} title="Şifre Sıfırla" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                    <KeyRound size={14} />
                  </button>
                  <button onClick={() => openDelete(u)} title="Sil" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b42318' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: 'var(--brand)' }}>
              {modal === 'create' ? 'Yeni Kullanıcı Ekle' : 'Kullanıcı Düzenle'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Ad</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} placeholder="Ahmet" required />
                </div>
                <div>
                  <label style={lbl}>Soyad</label>
                  <input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} style={inp} placeholder="Yılmaz" required />
                </div>
              </div>
              <div>
                <label style={lbl}>E-posta</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} placeholder="ornek@email.com" required />
              </div>
              <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Telefon</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} placeholder="05XX..." />
                </div>
                <div>
                  <label style={lbl}>Rol</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inp}>
                    <option value="CUSTOMER">Müşteri</option>
                    <option value="SALON_OWNER">İşletme Sahibi</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>{modal === 'create' ? 'Şifre' : 'Yeni Şifre (değiştirmek için)'}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inp} placeholder={modal === 'create' ? 'En az 6 karakter' : 'Boş bırakırsan değişmez'} />
              </div>
              {modal === 'edit' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--brand)' }} />
                  <label htmlFor="isActive" style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Hesap aktif</label>
                </div>
              )}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#b42318' }}>Kullanıcıyı Sil</h2>
            <p style={{ fontSize: 14, color: 'var(--muted-color)', marginBottom: 6 }}>
              <strong>{selected.name} {selected.surname}</strong> ({selected.email}) kullanıcısını kalıcı olarak silmek istiyor musunuz?
            </p>
            {selected.businesses.length > 0 && (
              <p style={{ fontSize: 13, color: '#b42318', marginBottom: 8 }}>Bu kullanıcının {selected.businesses.length} işletmesi de silinecek!</p>
            )}
            <p style={{ fontSize: 13, color: '#b42318', marginBottom: 20 }}>Bu işlem geri alınamaz.</p>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: 'var(--brand)' }}>Şifre Sıfırla</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 20 }}>
              <strong>{selected.name} {selected.surname}</strong> için yeni şifre belirleyin
            </p>
            <label style={lbl}>Yeni Şifre</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={{ ...inp, marginBottom: 20 }} placeholder="En az 6 karakter" />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--line)', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>İptal</button>
              <button onClick={handlePwReset} disabled={saving} style={{ padding: '9px 20px', borderRadius: 10, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Kaydediliyor...' : 'Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
