import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--brand)', color: 'white', marginTop: 'auto' }}>
      <div className="bk-footer-inner" style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 28px 32px' }}>
        <div className="bk-footer-grid" style={{ display: 'grid', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ marginBottom: 16, display: 'inline-block', background: 'white', borderRadius: 12, padding: '8px 16px' }}>
              <Image src="/logo.png" alt="Bakımla" width={200} height={54} style={{ objectFit: 'contain', height: 36, width: 'auto', display: 'block' }} />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', maxWidth: 280, marginBottom: 16 }}>
              Türkiye&apos;nin kişisel bakım randevu platformu. Berber, güzellik salonu, spa ve daha fazlası.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="#" aria-label="Instagram" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" aria-label="Facebook" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" aria-label="Twitter" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}>Platform</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FooterLink href="/search" label="İşletme Ara" />
              <FooterLink href="/kampanyalar" label="Kampanyalar" />
              <FooterLink href="/blog" label="Blog" />
              <FooterLink href="/pricing" label="Fiyatlar" />
              <FooterLink href="/auth/register" label="İşletme Kaydı" />
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}>Kategoriler</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FooterLink href="/search?category=BARBER" label="Berber" />
              <FooterLink href="/search?category=HAIR_SALON" label="Kuaför" />
              <FooterLink href="/search?category=BEAUTY_CENTER" label="Güzellik Salonu" />
              <FooterLink href="/search?category=SPA" label="Spa & Masaj" />
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}>Hesap</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FooterLink href="/auth/login" label="Giriş Yap" />
              <FooterLink href="/auth/register" label="Kayıt Ol" />
              <FooterLink href="/customer/appointments" label="Randevularım" />
            </div>
          </div>
        </div>

        <div className="bk-footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.5)', gap: 8 }}>
          <span>© 2025 Bakımla. Tüm hakları saklıdır.</span>
          <span>Türkiye genelinde hizmet vermektedir.</span>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', transition: 'color 0.15s' }}>
      {label}
    </Link>
  )
}
