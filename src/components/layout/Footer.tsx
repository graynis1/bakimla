import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--brand)', color: 'white', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 28px 32px' }}>
        <div className="bk-footer-grid" style={{ display: 'grid', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ marginBottom: 16, display: 'inline-block', background: 'white', borderRadius: 12, padding: '8px 16px' }}>
              <Image src="/logo.png" alt="Bakımla" width={200} height={54} style={{ objectFit: 'contain', height: 36, width: 'auto', display: 'block' }} />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', maxWidth: 280 }}>
              Türkiye&apos;nin kişisel bakım randevu platformu. Berber, güzellik salonu, spa ve daha fazlası.
            </p>
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
