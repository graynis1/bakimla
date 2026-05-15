'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [tab, setTab] = useState<'customer' | 'business'>('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!data.ok) {
        toast.error('E-posta veya şifre hatalı')
        return
      }

      const role = data.role
      if (role === 'ADMIN') window.location.href = '/admin/dashboard'
      else if (role === 'SALON_OWNER') window.location.href = '/salon/dashboard'
      else window.location.href = callbackUrl
    } catch {
      toast.error('Bağlantı hatası, tekrar deneyin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>Giriş Yap</h1>
          <p style={{ fontSize: 14, color: 'var(--muted-color)', marginTop: 4 }}>Hesabınıza erişin</p>
        </div>

        <div style={{ background: 'white', borderRadius: 18, border: '1px solid var(--line)', padding: 32, boxShadow: 'var(--bk-shadow)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--surface-2)', borderRadius: 12, padding: 4 }}>
            {(['customer', 'business'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '8px 0', fontSize: 14, fontWeight: 700,
                  borderRadius: 10, background: tab === t ? 'white' : 'transparent',
                  color: tab === t ? 'var(--brand)' : 'var(--muted-color)',
                  border: 0, cursor: 'pointer',
                }}
              >
                {t === 'customer' ? 'Müşteri Girişi' : 'İşletme Girişi'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="mt-1" />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold rounded-xl mt-2"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ fontSize: 14, color: 'var(--muted-color)', marginBottom: 8 }}>
              Hesabınız yok mu?{' '}
              <Link href="/auth/register" style={{ fontWeight: 700, color: 'var(--gold)', textDecoration: 'none' }}>Kayıt Ol</Link>
            </p>
            <Link href="/auth/forgot-password" style={{ fontSize: 13, color: 'var(--muted-color)', textDecoration: 'none' }}>Şifremi unuttum</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <LoginForm />
    </Suspense>
  )
}
