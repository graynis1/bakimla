'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (res.ok) {
      setSent(true)
    } else {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Şifremi Unuttum</h1>
          <p style={{ fontSize: 14, color: 'var(--muted-color)' }}>E-posta adresinize sıfırlama bağlantısı göndereceğiz.</p>
        </div>

        {sent ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#15803d', marginBottom: 8 }}>E-posta Gönderildi</div>
            <p style={{ fontSize: 14, color: '#166534' }}>Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.</p>
            <Link href="/auth/login" style={{ display: 'inline-block', marginTop: 20, fontSize: 14, color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Giriş Yap →</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 32 }}>
            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#b42318', marginBottom: 16 }}>
                {error}
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>E-posta Adresi</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', height: 48, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 800, fontSize: 15, border: 0, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--muted-color)' }}>
              <Link href="/auth/login" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Giriş Yap</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
