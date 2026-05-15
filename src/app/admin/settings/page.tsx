'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import ImageUpload from '@/components/ui/ImageUpload'

interface SmtpSettings {
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_pass: string
  smtp_secure: string
  smtp_from_name: string
  smtp_from_email: string
}

interface SiteContent {
  site_title: string
  site_tagline: string
  hero_title: string
  hero_subtitle: string
  hero_cta_text: string
  hero_image: string
  promo_text: string
  promo_code: string
  footer_description: string
  footer_phone: string
  footer_email: string
  footer_address: string
  contact_whatsapp: string
}

const SMTP_DEFAULTS: SmtpSettings = {
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_pass: '',
  smtp_secure: 'false',
  smtp_from_name: 'Bakımla',
  smtp_from_email: '',
}

const CONTENT_DEFAULTS: SiteContent = {
  site_title: 'Bakımla',
  site_tagline: 'Kişisel Bakım Randevu Platformu',
  hero_title: 'Kendine iyi bak, randevunu kolay al.',
  hero_subtitle: 'Berberden spaya, güzellik merkezinden pilatese kadar tüm bakım hizmetleri tek platformda.',
  hero_cta_text: 'İşletme Bul',
  hero_image: '',
  promo_text: 'İlk randevuna özel %20 indirim!',
  promo_code: 'BAKIMLA20',
  footer_description: 'Türkiye\'nin en büyük kişisel bakım randevu platformu.',
  footer_phone: '',
  footer_email: 'info@bakimla.com',
  footer_address: '',
  contact_whatsapp: '',
}

type Tab = 'smtp' | 'content'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('smtp')
  const [smtp, setSmtp] = useState<SmtpSettings>(SMTP_DEFAULTS)
  const [content, setContent] = useState<SiteContent>(CONTENT_DEFAULTS)
  const [testEmail, setTestEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        setSmtp((prev) => ({ ...prev, ...data }))
        setContent((prev) => ({ ...prev, ...data }))
      })
  }, [])

  async function handleSaveSmtp() {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtp),
    })
    setSaving(false)
    if (res.ok) toast.success('SMTP ayarları kaydedildi')
    else toast.error('Kaydedilemedi')
  }

  async function handleSaveContent() {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    })
    setSaving(false)
    if (res.ok) toast.success('Site içeriği kaydedildi')
    else toast.error('Kaydedilemedi')
  }

  async function handleTest() {
    if (!testEmail) { toast.error('Test e-posta adresi girin'); return }
    setTesting(true)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test', testEmail }),
    })
    const data = await res.json()
    setTesting(false)
    if (res.ok) toast.success(data.message ?? 'Test e-postası gönderildi')
    else toast.error(data.error ?? 'Gönderilemedi')
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const, outline: 'none' }

  function smtpField(key: keyof SmtpSettings, label: string, type = 'text', placeholder = '') {
    return (
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{label}</label>
        <input
          type={type}
          value={smtp[key]}
          placeholder={placeholder}
          onChange={(e) => setSmtp({ ...smtp, [key]: e.target.value })}
          style={inputStyle}
        />
      </div>
    )
  }

  function contentField(key: keyof SiteContent, label: string, multiline = false, placeholder = '') {
    return (
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{label}</label>
        {multiline ? (
          <textarea
            value={content[key]}
            placeholder={placeholder}
            onChange={(e) => setContent({ ...content, [key]: e.target.value })}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        ) : (
          <input
            type="text"
            value={content[key]}
            placeholder={placeholder}
            onChange={(e) => setContent({ ...content, [key]: e.target.value })}
            style={inputStyle}
          />
        )}
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'smtp', label: 'E-posta / SMTP' },
    { key: 'content', label: 'Site İçeriği' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', marginBottom: 24 }}>Sistem Ayarları</h1>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'white', border: '1px solid var(--line)', borderRadius: 16, padding: 6, width: 'fit-content' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '8px 20px', borderRadius: 12, border: 0, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              background: activeTab === t.key ? 'var(--brand)' : 'transparent',
              color: activeTab === t.key ? 'white' : 'var(--muted-color)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SMTP tab */}
      {activeTab === 'smtp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>E-posta / SMTP Yapılandırması</h2>
                <p style={{ fontSize: 13, color: 'var(--muted-color)', margin: 0 }}>
                  Sistem e-postalarının gönderilmesi için SMTP sunucu bilgilerini girin.
                </p>
              </div>
              <button onClick={handleSaveSmtp} disabled={saving}
                style={{ height: 42, padding: '0 22px', borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: saving ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="bk-form-grid-2">
              {smtpField('smtp_host', 'SMTP Sunucu', 'text', 'smtp.gmail.com')}
              {smtpField('smtp_port', 'Port', 'text', '587')}
              {smtpField('smtp_user', 'Kullanıcı Adı / E-posta', 'text', 'info@siteniz.com')}
              {smtpField('smtp_pass', 'Şifre / Uygulama Şifresi', 'password', '••••••••')}
              {smtpField('smtp_from_name', 'Gönderici Adı', 'text', 'Bakımla')}
              {smtpField('smtp_from_email', 'Gönderici E-posta', 'text', 'info@bakimla.com')}
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={smtp.smtp_secure === 'true'}
                  onChange={(e) => setSmtp({ ...smtp, smtp_secure: e.target.checked ? 'true' : 'false' })}
                  style={{ width: 18, height: 18, accentColor: 'var(--brand)' }}
                />
                SSL/TLS Kullan (Port 465 için)
              </label>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 28 }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Test E-postası Gönder</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 20 }}>
              SMTP ayarlarını kaydedin, ardından bir test e-postası göndererek yapılandırmayı doğrulayın.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="email"
                value={testEmail}
                placeholder="test@example.com"
                onChange={(e) => setTestEmail(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
              />
              <button onClick={handleTest} disabled={testing}
                style={{ padding: '0 24px', borderRadius: 12, background: '#1a1a1a', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: testing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {testing ? 'Gönderiliyor...' : 'Test Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content tab */}
      {activeTab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Site identity */}
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Site Kimliği</h2>
                <p style={{ fontSize: 13, color: 'var(--muted-color)', margin: 0 }}>Sitenin genel isim ve açıklamaları.</p>
              </div>
              <button onClick={handleSaveContent} disabled={saving}
                style={{ height: 42, padding: '0 22px', borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: saving ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                {saving ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="bk-form-grid-2">
              {contentField('site_title', 'Site Başlığı', false, 'Bakımla')}
              {contentField('site_tagline', 'Slogan', false, 'Kişisel Bakım Platformu')}
            </div>
          </div>

          {/* Hero section */}
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 28 }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Ana Sayfa Hero</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 24 }}>Ana sayfada üstte görünen büyük başlık alanı.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {contentField('hero_title', 'Ana Başlık', true, 'Kendine iyi bak, randevunu kolay al.')}
              {contentField('hero_subtitle', 'Alt Başlık', true, 'Berberden spaya kadar tüm hizmetler...')}
              {contentField('hero_cta_text', 'Buton Yazısı', false, 'İşletme Bul')}
              <div>
                <ImageUpload
                  label="Hero Görseli"
                  value={content.hero_image}
                  onChange={(url) => setContent({ ...content, hero_image: url })}
                  aspectRatio="16/9"
                  height={200}
                  hint="Önerilen boyut: 1440×600px"
                />
              </div>
            </div>
          </div>

          {/* Promo */}
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 28 }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Kampanya Bandı</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 24 }}>Ana sayfada görünen promosyon alanı.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="bk-form-grid-2">
              {contentField('promo_text', 'Kampanya Metni', false, 'İlk randevuna özel %20 indirim!')}
              {contentField('promo_code', 'İndirim Kodu', false, 'BAKIMLA20')}
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 28 }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Footer İçeriği</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 24 }}>Sayfanın alt kısmında görünen bilgiler.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {contentField('footer_description', 'Açıklama', true, 'Türkiye\'nin en büyük kişisel bakım platformu.')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="bk-form-grid-2">
                {contentField('footer_phone', 'Telefon', false, '+90 555 000 00 00')}
                {contentField('footer_email', 'E-posta', false, 'info@bakimla.com')}
                {contentField('footer_address', 'Adres', false, 'İstanbul, Türkiye')}
                {contentField('contact_whatsapp', 'WhatsApp', false, '+90 555 000 00 00')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSaveContent} disabled={saving}
              style={{ height: 46, padding: '0 32px', borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Kaydediliyor...' : 'Tüm İçeriği Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
