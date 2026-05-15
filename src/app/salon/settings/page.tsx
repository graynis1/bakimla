'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface Settings {
  confirmationRequired: boolean
  autoConfirm: boolean
  reminderHours: number
  bookingWindowDays: number
  cancelWindowHours: number
}

const DEFAULT: Settings = {
  confirmationRequired: true,
  autoConfirm: false,
  reminderHours: 24,
  bookingWindowDays: 30,
  cancelWindowHours: 24,
}

export default function SalonSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT)
  const [saving, setSaving] = useState(false)

  // For now, settings are stored locally (can be extended to DB later)
  useEffect(() => {
    const stored = localStorage.getItem('salon_settings')
    if (stored) {
      try { setSettings(JSON.parse(stored)) } catch { /* use default */ }
    }
  }, [])

  async function handleSave() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    localStorage.setItem('salon_settings', JSON.stringify(settings))
    setSaving(false)
    toast.success('Ayarlar kaydedildi')
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Ayarlar</h1>
        <button onClick={handleSave} disabled={saving} style={{ height: 44, padding: '0 24px', borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Randevu ayarları */}
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Randevu Ayarları</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ToggleSetting
              label="Randevu Onayı Gerekli"
              desc="Müşterilerin randevuları siz onaylayana kadar beklemede kalır."
              checked={settings.confirmationRequired}
              onChange={(v) => setSettings({ ...settings, confirmationRequired: v, autoConfirm: v ? false : settings.autoConfirm })}
            />
            <ToggleSetting
              label="Otomatik Onay"
              desc="Gelen randevular otomatik olarak onaylanır."
              checked={settings.autoConfirm}
              onChange={(v) => setSettings({ ...settings, autoConfirm: v, confirmationRequired: v ? false : settings.confirmationRequired })}
            />
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Randevu Penceresi (gün)</label>
              <p style={{ fontSize: 12, color: 'var(--muted-color)', marginBottom: 8 }}>Müşteriler kaç gün öncesine kadar randevu alabilir?</p>
              <select value={settings.bookingWindowDays} onChange={(e) => setSettings({ ...settings, bookingWindowDays: Number(e.target.value) })} style={{ ...inputStyle, maxWidth: 200 }}>
                {[7, 14, 21, 30, 45, 60].map((d) => <option key={d} value={d}>{d} gün</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>İptal Süresi</label>
              <p style={{ fontSize: 12, color: 'var(--muted-color)', marginBottom: 8 }}>Müşteriler randevudan kaç saat öncesine kadar iptal edebilir?</p>
              <select value={settings.cancelWindowHours} onChange={(e) => setSettings({ ...settings, cancelWindowHours: Number(e.target.value) })} style={{ ...inputStyle, maxWidth: 200 }}>
                {[1, 2, 4, 8, 12, 24, 48].map((h) => <option key={h} value={h}>{h} saat</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Bildirim ayarları */}
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Bildirim Ayarları</h2>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Hatırlatma Bildirimi</label>
            <p style={{ fontSize: 12, color: 'var(--muted-color)', marginBottom: 8 }}>Randevudan kaç saat önce müşteriye hatırlatma gönderilsin?</p>
            <select value={settings.reminderHours} onChange={(e) => setSettings({ ...settings, reminderHours: Number(e.target.value) })} style={{ ...inputStyle, maxWidth: 200 }}>
              {[1, 2, 4, 8, 12, 24, 48].map((h) => <option key={h} value={h}>{h} saat önce</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleSetting({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 12 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 2 }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 48, height: 26, borderRadius: 99, border: 0, cursor: 'pointer', flexShrink: 0,
          background: checked ? 'var(--brand)' : '#d1d5db', transition: 'background 0.2s', position: 'relative',
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: 'white',
          position: 'absolute', top: 3, left: checked ? 25 : 3, transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}
