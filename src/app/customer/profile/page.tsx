'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { User, Lock } from 'lucide-react'

interface Profile {
  name: string
  surname: string
  email: string
  phone?: string | null
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<Profile>({ name: '', surname: '', email: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: '', next: '', confirm: '' })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    fetch('/api/users/profile')
      .then((r) => r.json())
      .then((d) => { if (d.success) setProfile(d.data) })
      .finally(() => setLoading(false))
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (data.success) toast.success('Profil güncellendi')
      else toast.error(data.error)
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwordData.next !== passwordData.confirm) {
      toast.error('Yeni şifreler eşleşmiyor')
      return
    }
    setChangingPassword(true)
    try {
      const res = await fetch('/api/users/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordData.current, newPassword: passwordData.next }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Şifre güncellendi')
        setPasswordData({ current: '', next: '', confirm: '' })
      } else {
        toast.error(data.error)
      }
    } finally {
      setChangingPassword(false)
    }
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }

  if (loading) return <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, height: 300 }} className="animate-pulse" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Profilim</h1>

      {/* Profile form */}
      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, fontWeight: 800, fontSize: 16 }}>
          <User size={18} style={{ color: 'var(--brand)' }} /> Kişisel Bilgiler
        </div>
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Ad</label>
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Soyad</label>
              <input value={profile.surname} onChange={(e) => setProfile({ ...profile, surname: e.target.value })} style={inputStyle} required />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>E-posta</label>
            <input value={profile.email} style={{ ...inputStyle, background: '#f9f9f9', color: 'var(--muted-color)' }} disabled />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Telefon</label>
            <input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} style={inputStyle} placeholder="05XX XXX XX XX" />
          </div>
          <button type="submit" disabled={saving} style={{ height: 44, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </div>

      {/* Password change */}
      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, fontWeight: 800, fontSize: 16 }}>
          <Lock size={18} style={{ color: 'var(--brand)' }} /> Şifre Değiştir
        </div>
        <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Mevcut Şifre</label>
            <input type="password" value={passwordData.current} onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })} style={inputStyle} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Yeni Şifre</label>
            <input type="password" value={passwordData.next} onChange={(e) => setPasswordData({ ...passwordData, next: e.target.value })} style={inputStyle} required minLength={6} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Yeni Şifre (Tekrar)</label>
            <input type="password" value={passwordData.confirm} onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} style={inputStyle} required />
          </div>
          <button type="submit" disabled={changingPassword} style={{ height: 44, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: changingPassword ? 'not-allowed' : 'pointer' }}>
            {changingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  )
}
