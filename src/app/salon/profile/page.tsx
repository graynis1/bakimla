'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { categoryLabels } from '@/lib/utils'
import { cityList, getDistricts } from '@/lib/locations'
import type { BusinessCategory } from '@/generated/prisma'
import ImageUpload from '@/components/ui/ImageUpload'

const CATEGORIES = Object.entries(categoryLabels) as [BusinessCategory, string][]

const DAYS = [
  { key: 'mon', label: 'Pazartesi' },
  { key: 'tue', label: 'Salı' },
  { key: 'wed', label: 'Çarşamba' },
  { key: 'thu', label: 'Perşembe' },
  { key: 'fri', label: 'Cuma' },
  { key: 'sat', label: 'Cumartesi' },
  { key: 'sun', label: 'Pazar' },
]

interface WorkingDay { isOpen: boolean; open: string; close: string }
type WorkingHours = Record<string, WorkingDay>

interface BusinessProfile {
  name: string
  category: BusinessCategory
  description: string
  phone: string
  address: string
  city: string
  district: string
  coverImage: string
  workingHours: WorkingHours
  metaTitle: string
  metaDescription: string
  whatsapp: string
  instagram: string
  businessEmail: string
}

const defaultWH: WorkingHours = Object.fromEntries(
  DAYS.map(({ key }) => [key, { isOpen: key !== 'sun', open: '09:00', close: '19:00' }])
)

export default function SalonProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile>({
    name: '', category: 'HAIR_SALON', description: '', phone: '',
    address: '', city: '', district: '', coverImage: '',
    workingHours: defaultWH, metaTitle: '', metaDescription: '',
    whatsapp: '', instagram: '', businessEmail: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/salon/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProfile({
          ...d.data,
          description: d.data.description ?? '',
          coverImage: d.data.coverImage ?? '',
          metaTitle: d.data.metaTitle ?? '',
          metaDescription: d.data.metaDescription ?? '',
          whatsapp: d.data.whatsapp ?? '',
          instagram: d.data.instagram ?? '',
          businessEmail: d.data.businessEmail ?? '',
          workingHours: d.data.workingHours || defaultWH,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  function updateWH(day: string, field: keyof WorkingDay, value: string | boolean) {
    setProfile((p) => ({ ...p, workingHours: { ...p.workingHours, [day]: { ...p.workingHours[day], [field]: value } } }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/salon/profile', {
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

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block' as const, fontSize: 13, fontWeight: 700 as const, marginBottom: 6 }

  if (loading) return <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, height: 400 }} className="animate-pulse" />

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Salon Profilim</h1>
        <button type="submit" disabled={saving} style={{ height: 44, padding: '0 24px', borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basic info */}
        <section style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontWeight: 800, marginBottom: 16, fontSize: 16 }}>Temel Bilgiler</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>İşletme Adı</label>
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Kategori</label>
                <select value={profile.category} onChange={(e) => setProfile({ ...profile, category: e.target.value as BusinessCategory })} style={inputStyle}>
                  {CATEGORIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Açıklama</label>
              <textarea value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Telefon</label>
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <ImageUpload
                label="Kapak Fotoğrafı"
                value={profile.coverImage}
                onChange={(url) => setProfile({ ...profile, coverImage: url })}
                hint="Önerilen boyut: 1200×400px"
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontWeight: 800, marginBottom: 16, fontSize: 16 }}>Adres</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Şehir</label>
                <select value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value, district: '' })} style={inputStyle}>
                  <option value="">Seçin</option>
                  {cityList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>İlçe</label>
                <select value={profile.district} onChange={(e) => setProfile({ ...profile, district: e.target.value })} style={inputStyle} disabled={!profile.city}>
                  <option value="">Seçin</option>
                  {getDistricts(profile.city).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Açık Adres</label>
              <input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </section>

        {/* Working hours */}
        <section style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontWeight: 800, marginBottom: 16, fontSize: 16 }}>Çalışma Saatleri</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DAYS.map(({ key, label }) => {
              const day = profile.workingHours[key] ?? { isOpen: false, open: '09:00', close: '19:00' }
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, width: 100, flexShrink: 0, cursor: 'pointer' }}>
                    <input type="checkbox" checked={day.isOpen} onChange={(e) => updateWH(key, 'isOpen', e.target.checked)} style={{ accentColor: 'var(--brand)', width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                  </label>
                  {day.isOpen ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="time" value={day.open} onChange={(e) => updateWH(key, 'open', e.target.value)} style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13 }} />
                      <span style={{ fontSize: 13, color: 'var(--muted-color)' }}>—</span>
                      <input type="time" value={day.close} onChange={(e) => updateWH(key, 'close', e.target.value)} style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13 }} />
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--danger)' }}>Kapalı</span>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Social Media */}
        <section style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontWeight: 800, marginBottom: 4, fontSize: 16 }}>Sosyal Medya & İletişim</h2>
          <p style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 16 }}>Müşterilerinizin size ulaşabileceği ek kanallar (isteğe bağlı)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="bk-form-grid-2">
              <div>
                <label style={labelStyle}>WhatsApp Numarası</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--muted-color)', pointerEvents: 'none' }}>+90</span>
                  <input
                    value={profile.whatsapp}
                    onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                    style={{ ...inputStyle, paddingLeft: 44 }}
                    placeholder="5XX XXX XX XX"
                    type="tel"
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted-color)', marginTop: 4, display: 'block' }}>Sadece rakam girin (ör: 5321234567)</span>
              </div>
              <div>
                <label style={labelStyle}>İşletme E-posta</label>
                <input
                  value={profile.businessEmail}
                  onChange={(e) => setProfile({ ...profile, businessEmail: e.target.value })}
                  style={inputStyle}
                  placeholder="isletme@ornek.com"
                  type="email"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Instagram Kullanıcı Adı</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--muted-color)', pointerEvents: 'none' }}>@</span>
                <input
                  value={profile.instagram}
                  onChange={(e) => setProfile({ ...profile, instagram: e.target.value.replace('@', '') })}
                  style={{ ...inputStyle, paddingLeft: 28 }}
                  placeholder="kullaniciadi"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SEO */}
        <section style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontWeight: 800, marginBottom: 16, fontSize: 16 }}>SEO</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Meta Başlık</label>
              <input value={profile.metaTitle} onChange={(e) => setProfile({ ...profile, metaTitle: e.target.value })} style={inputStyle} placeholder="İşletme adı | Bakımla" />
            </div>
            <div>
              <label style={labelStyle}>Meta Açıklama</label>
              <textarea value={profile.metaDescription} onChange={(e) => setProfile({ ...profile, metaDescription: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} maxLength={160} />
            </div>
          </div>
        </section>
      </div>
    </form>
  )
}
