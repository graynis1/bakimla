import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BusinessCard from '@/components/shared/BusinessCard'
import { ArrowRight, Search } from 'lucide-react'

const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&h=600&auto=format&fit=crop&q=80'

async function getPageData() {
  try {
    const [businesses, heroImageConfig] = await Promise.all([
      prisma.business.findMany({
        where: { status: 'APPROVED' },
        orderBy: { rating: 'desc' },
        take: 8,
      }),
      prisma.systemConfig.findUnique({ where: { key: 'hero_image' } }),
    ])
    return { businesses, heroImage: heroImageConfig?.value || DEFAULT_HERO_IMAGE }
  } catch {
    return { businesses: [], heroImage: DEFAULT_HERO_IMAGE }
  }
}

const CAT_ICONS: Record<string, React.ReactNode> = {
  BARBER: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3"/><circle cx="19" cy="7" r="3"/>
      <line x1="9" y1="10" x2="19" y2="10"/>
      <line x1="9" y1="10" x2="5" y2="22"/><line x1="19" y1="10" x2="23" y2="22"/>
      <line x1="5" y1="22" x2="23" y2="22"/><line x1="12" y1="16" x2="16" y2="16"/>
    </svg>
  ),
  HAIR_SALON: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="8" r="4"/>
      <path d="M8 28c0-5 2-9 6-10h0c4 1 6 5 6 10"/>
      <path d="M11 14 Q7 17 8 22"/><path d="M17 14 Q21 17 20 22"/>
    </svg>
  ),
  NAIL_SALON: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="5" height="14" rx="2.5"/>
      <rect x="16" y="5" width="5" height="12" rx="2.5"/>
      <rect x="2" y="6" width="5" height="11" rx="2.5"/>
      <path d="M4 18 Q5 24 9 25 L19 25 Q23 24 24 18"/>
    </svg>
  ),
  BEAUTY_CENTER: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="13" r="7"/><circle cx="14" cy="13" r="3"/>
      <line x1="14" y1="2" x2="14" y2="6"/><line x1="14" y1="20" x2="14" y2="26"/>
      <line x1="2" y1="13" x2="6" y2="13"/><line x1="22" y1="13" x2="26" y2="13"/>
    </svg>
  ),
  MASSAGE: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="6" r="3"/>
      <path d="M8 12 Q6 17 8 22 L12 22"/><path d="M20 12 Q22 17 20 22 L16 22"/>
      <path d="M10 11 Q14 14 18 11"/><path d="M12 22 L14 26 L16 22"/>
    </svg>
  ),
  EPILATION: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3 L16.5 9 L22 9 L18 13 L20 19 L14 15 L8 19 L10 13 L6 9 L11.5 9 Z"/>
    </svg>
  ),
  SKIN_CARE: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4 C14 4 7 10 7 17 A7 7 0 0 0 21 17 C21 10 14 4 14 4Z"/>
      <line x1="14" y1="14" x2="14" y2="22"/>
      <line x1="10" y1="18" x2="14" y2="14"/><line x1="18" y1="16" x2="14" y2="14"/>
    </svg>
  ),
  MORE: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="14" r="11"/>
      <line x1="14" y1="9" x2="14" y2="19"/><line x1="9" y1="14" x2="19" y2="14"/>
    </svg>
  ),
}

const CATEGORIES = [
  { key: 'BARBER', label: 'Berber' },
  { key: 'HAIR_SALON', label: 'Kuaför' },
  { key: 'NAIL_SALON', label: 'Nail Art' },
  { key: 'BEAUTY_CENTER', label: 'Güzellik Merkezi' },
  { key: 'MASSAGE', label: 'Masaj' },
  { key: 'EPILATION', label: 'Epilasyon' },
  { key: 'SKIN_CARE', label: 'Cilt Bakım' },
  { key: 'MORE', label: 'Daha Fazlası' },
]

export default async function HomePage() {
  const { businesses, heroImage } = await getPageData()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main>

        {/* ── Hero — full-width, edge-to-edge ── */}
        <section
          className="bk-hero-section"
          style={{
            display: 'grid',
            gridTemplateColumns: '55% 45%',
            minHeight: 500,
            overflow: 'hidden',
            background: 'var(--bg)',
          }}
        >
          {/* Left — content */}
          <div
            className="bk-hero-content"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '64px 48px 64px max(28px, calc((100vw - 1320px) / 2 + 28px))',
            }}
          >
            <div style={{ maxWidth: 520 }}>
              <h1 style={{
                fontSize: 44,
                lineHeight: 1.1,
                fontWeight: 900,
                color: 'var(--text)',
                letterSpacing: '-1px',
                margin: '0 0 14px',
              }}>
                Kendine iyi bak,<br />
                randevunu{' '}
                <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>kolay</span> al.
              </h1>
              <p style={{
                fontSize: 15,
                color: 'var(--muted-color)',
                lineHeight: 1.7,
                margin: '0 0 28px',
              }}>
                Berberden spa&apos;ya, güzellik merkezinden pilatese kadar tüm bakım hizmetleri tek platformda.
              </p>

              {/* Search bar */}
              <form
                action="/search"
                method="GET"
                className="bk-search-form"
                style={{
                  display: 'flex',
                  background: 'white',
                  border: '1.5px solid var(--line)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(15,23,36,0.08)',
                  maxWidth: 520,
                }}
              >
                <div className="bk-search-input-wrap" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', height: 52 }}>
                  <Search size={15} color="#9ca3af" style={{ flexShrink: 0 }} />
                  <input
                    name="query"
                    placeholder="Hizmet veya kategori ara..."
                    style={{ flex: 1, border: 0, outline: 'none', fontSize: 13.5, background: 'transparent', color: 'var(--text)', minWidth: 0 }}
                  />
                </div>
                <div className="bk-search-divider" style={{ width: 1, background: 'var(--line)', margin: '12px 0' }} />
                <div className="bk-search-city-wrap" style={{ display: 'flex', alignItems: 'center', padding: '0 14px', height: 52, gap: 6 }}>
                  <select
                    name="city"
                    style={{ border: 0, outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--text)', fontFamily: 'inherit', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
                  >
                    <option value="">Konum</option>
                    {['Ankara', 'İstanbul', 'İzmir', 'Bursa', 'Antalya'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="bk-search-divider" style={{ width: 1, background: 'var(--line)', margin: '12px 0' }} />
                <button type="submit" className="bk-search-btn" style={{ padding: '0 24px', height: 52, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Ara
                </button>
              </form>

              <div style={{ display: 'flex', gap: 20, marginTop: 20, fontSize: 13, color: 'var(--muted-color)' }}>
                <span>✓ Ücretsiz rezervasyon</span>
                <span>✓ Anında onay</span>
                <span>✓ 500+ işletme</span>
              </div>
            </div>
          </div>

          {/* Right — salon photo */}
          <div
            className="bk-hero-image"
            style={{ position: 'relative', overflow: 'hidden', minHeight: 400 }}
          >
            <Image
              src={heroImage}
              alt="Güzellik salonu"
              fill
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
              priority
              unoptimized={heroImage.startsWith('http')}
            />
            {/* Left-edge blend */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(to right, var(--bg) 0%, rgba(247,245,241,0.4) 20%, transparent 50%)',
            }} />
          </div>
        </section>

        {/* ── Below-hero content ── */}
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 20px 40px' }}>

          {/* ── Categories ── */}
          <div
            className="bk-cat-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10, marginTop: 18 }}
          >
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                href={cat.key === 'MORE' ? '/search' : `/search?category=${cat.key}`}
                className="bk-cat-card"
                style={{
                  background: 'white',
                  border: '1px solid var(--line)',
                  borderRadius: 14,
                  padding: '16px 10px 14px',
                  textAlign: 'center',
                  fontSize: 11.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                  color: 'var(--text)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ color: 'var(--text)', opacity: 0.8 }}>{CAT_ICONS[cat.key]}</span>
                {cat.label}
              </Link>
            ))}
          </div>

          {/* ── Popular businesses ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '28px 0 14px' }}>
            <h2 style={{ fontSize: 21, margin: 0, fontWeight: 800 }}>Popüler işletmeler</h2>
            <Link href="/search" style={{ color: 'var(--muted-color)', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Tümünü Gör <ArrowRight size={13} />
            </Link>
          </div>

          <div className="bk-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {businesses.length > 0
              ? businesses.map((b) => <BusinessCard key={b.id} business={b} />)
              : [1,2,3,4].map((i) => (
                  <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16 }}>
                    <div style={{ height: 152, background: 'var(--surface-2)', borderRadius: '16px 16px 0 0' }} />
                    <div style={{ padding: 14 }}>
                      <div style={{ height: 13, background: 'var(--surface-2)', borderRadius: 6, marginBottom: 8 }} />
                      <div style={{ height: 11, background: 'var(--surface-2)', borderRadius: 6, width: '60%' }} />
                    </div>
                  </div>
                ))
            }
          </div>

          {/* ── Promo ── */}
          <div className="bk-promo-banner" style={{
            margin: '24px 0',
            background: 'linear-gradient(100deg, #18100a 0%, #3a2010 55%, #54320e 100%)',
            color: 'white', borderRadius: 18, padding: '24px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <strong style={{ fontSize: 18, display: 'block', marginBottom: 4 }}>İlk randevuna özel %20 indirim!</strong>
              <span style={{ fontSize: 13, opacity: 0.75 }}>KOD: <b style={{ color: '#d4a860' }}>BAKIMLA20</b></span>
            </div>
            <Link href="/auth/register" style={{ height: 42, padding: '0 22px', borderRadius: 10, background: 'white', color: 'var(--text)', fontWeight: 700, fontSize: 13.5, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              Hemen Keşfet <ArrowRight size={13} />
            </Link>
          </div>

          {/* ── Blog preview ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '28px 0 14px' }}>
            <h2 style={{ fontSize: 21, margin: 0, fontWeight: 800 }}>Blog & İpuçları</h2>
            <Link href="/blog" style={{ color: 'var(--muted-color)', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Tüm Yazılar <ArrowRight size={13} />
            </Link>
          </div>
          <BlogPreview />

          {/* ── How it works ── */}
          <h2 style={{ fontSize: 21, fontWeight: 800, margin: '28px 0 14px' }}>Nasıl Çalışır?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }} className="bk-grid-3">
            {[
              { n: '1', title: 'İşletme Ara', desc: 'Şehir, kategori veya hizmet adına göre size en yakın işletmeleri bulun.' },
              { n: '2', title: 'Randevu Al', desc: 'Müsait saatleri görün, çalışanı seçin ve kolayca randevu oluşturun.' },
              { n: '3', title: 'Keyfini Çıkarın', desc: 'Randevu gününde işletmeye gidin ve bakımınızın keyfini çıkarın.' },
            ].map((step) => (
              <div key={step.n} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16, padding: 22 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, marginBottom: 14 }}>{step.n}</div>
                <h3 style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 7 }}>{step.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--muted-color)', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Business CTA ── */}
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, padding: '36px 32px', textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 21, fontWeight: 800, marginBottom: 8 }}>İşletmenizi Bakımla&apos;ya Ekleyin</h2>
            <p style={{ fontSize: 13.5, color: 'var(--muted-color)', marginBottom: 22, maxWidth: 420, margin: '0 auto 22px', lineHeight: 1.65 }}>
              14 gün ücretsiz deneme ile başlayın. Binlerce müşteriye ulaşın.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/pricing" style={{ height: 42, padding: '0 20px', borderRadius: 10, border: '1.5px solid var(--line)', fontWeight: 700, fontSize: 13.5, textDecoration: 'none', color: 'var(--text)', display: 'flex', alignItems: 'center' }}>Fiyatları İncele</Link>
              <Link href="/auth/register" style={{ height: 42, padding: '0 22px', borderRadius: 10, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 13.5, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                Ücretsiz Başla <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}

async function BlogPreview() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true, tags: true },
    })
    if (posts.length === 0) {
      return (
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16, padding: '32px', textAlign: 'center', color: 'var(--muted-color)', fontSize: 14 }}>
          Henüz blog yazısı eklenmemiş.{' '}
          <Link href="/blog" style={{ color: 'var(--brand)', fontWeight: 700 }}>Blog&apos;a git</Link>
        </div>
      )
    }
    return (
      <div className="bk-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 8 }}>
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="bk-card" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', height: '100%' }}>
              <div style={{ height: 160, background: post.coverImage ? `url(${post.coverImage}) center/cover` : 'var(--surface-2)', position: 'relative' }}>
                {!post.coverImage && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-color)', fontSize: 13 }}>Görsel yok</div>}
              </div>
              <div style={{ padding: '14px 16px' }}>
                {post.tags && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{post.tags.split(',')[0]}</span>}
                <h3 style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.4, margin: '6px 0 8px', color: 'var(--text)' }}>{post.title}</h3>
                {post.excerpt && <p style={{ fontSize: 12.5, color: 'var(--muted-color)', lineHeight: 1.55, margin: '0 0 10px' }}>{post.excerpt.slice(0, 100)}{post.excerpt.length > 100 ? '…' : ''}</p>}
                <div style={{ fontSize: 11.5, color: 'var(--muted-color)' }}>
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    )
  } catch {
    return null
  }
}
