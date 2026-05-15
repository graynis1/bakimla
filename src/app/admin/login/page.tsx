'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('E-posta ve şifre gereklidir.'); return }
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('E-posta veya şifre hatalı.')
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--brand)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: 'white', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 12px' }}>✂️</div>
          <div style={{ fontWeight: 900, fontSize: 22, color: 'white', letterSpacing: '-0.5px' }}>Bakımla</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>Yönetim Paneli</div>
        </div>

        <div style={{ background: 'white', borderRadius: 24, padding: 36 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, color: 'var(--brand)' }}>Yönetici Girişi</h1>
          <p style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 28 }}>Sadece yönetici hesaplarıyla erişilebilir.</p>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#b42318', marginBottom: 20, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bakimla.com"
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--brand)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--line)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--brand)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--line)' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 12,
                background: loading ? '#6b7280' : 'var(--brand)',
                color: 'white',
                fontWeight: 700,
                fontSize: 15,
                border: 0,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
              }}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/" style={{ fontSize: 13, color: 'var(--muted-color)', textDecoration: 'none' }}>
              ← Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
