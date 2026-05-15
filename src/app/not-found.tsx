import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function NotFound() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>✂️</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--brand)', marginBottom: 12 }}>404</h1>
        <p style={{ fontSize: 18, color: 'var(--muted-color)', marginBottom: 8 }}>Aradığınız sayfa bulunamadı.</p>
        <p style={{ fontSize: 14, color: 'var(--muted-color)', marginBottom: 32 }}>Sayfa silinmiş ya da taşınmış olabilir.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/" style={{ height: 48, padding: '0 28px', borderRadius: 14, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Ana Sayfaya Dön
          </Link>
          <Link href="/search" style={{ height: 48, padding: '0 28px', borderRadius: 14, border: '1px solid var(--line)', background: 'white', color: 'var(--text)', fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            İşletme Ara
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
