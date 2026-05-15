import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Tag, Calendar, ArrowRight } from 'lucide-react'
import CopyButton from '@/components/shared/CopyButton'

export const metadata: Metadata = {
  title: 'Kampanyalar & İndirimler | Bakımla',
  description: 'Bakımla\'nın özel kampanya ve indirimlerini keşfedin. Güzellik hizmetlerinde büyük tasarruf fırsatları.',
  openGraph: {
    title: 'Kampanyalar & İndirimler | Bakımla',
    description: 'Özel kampanya ve indirimler',
    type: 'website',
  },
}

async function getCampaigns() {
  const now = new Date()
  return prisma.campaign.findMany({
    where: {
      isActive: true,
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function KampanyalarPage() {
  let campaigns: Awaited<ReturnType<typeof getCampaigns>> = []
  try { campaigns = await getCampaigns() } catch { /* empty */ }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 24px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99, background: 'var(--gold-soft)', color: 'var(--gold)', fontSize: 12, fontWeight: 800, letterSpacing: '0.5px', marginBottom: 16 }}>
            <Tag size={13} /> ÖZEL FIRSATLAR
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', margin: '0 0 12px', letterSpacing: '-0.5px' }}>Kampanya & İndirimler</h1>
          <p style={{ fontSize: 15, color: 'var(--muted-color)', maxWidth: 480, margin: '0 auto' }}>
            Güzellik ve bakım hizmetlerinde özel fırsatları kaçırmayın.
          </p>
        </div>

        {campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', border: '1px solid var(--line)', borderRadius: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎁</div>
            <p style={{ color: 'var(--muted-color)', fontSize: 15, marginBottom: 20 }}>Şu an aktif kampanya bulunmuyor.</p>
            <Link href="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
              İşletmeleri Keşfet <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="bk-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {campaigns.map((camp) => (
              <div key={camp.id} className="bk-card" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
                {camp.imageUrl && (
                  <div style={{ height: 200, background: `url(${camp.imageUrl}) center/cover`, position: 'relative' }}>
                    {camp.discount && (
                      <div style={{ position: 'absolute', top: 16, right: 16, background: 'var(--danger)', color: 'white', fontWeight: 900, fontSize: 20, padding: '8px 16px', borderRadius: 12 }}>
                        %{camp.discount}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ padding: 24 }}>
                  {!camp.imageUrl && camp.discount && (
                    <div style={{ display: 'inline-block', background: 'var(--danger)', color: 'white', fontWeight: 900, fontSize: 22, padding: '6px 14px', borderRadius: 10, marginBottom: 12 }}>
                      %{camp.discount} İndirim
                    </div>
                  )}
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', margin: '0 0 8px' }}>{camp.title}</h2>
                  {camp.description && (
                    <p style={{ fontSize: 14, color: 'var(--muted-color)', lineHeight: 1.65, margin: '0 0 16px' }}>{camp.description}</p>
                  )}
                  {camp.endDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--muted-color)', marginBottom: 16 }}>
                      <Calendar size={13} />
                      Son geçerlilik: {new Date(camp.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                  {camp.code && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', border: '1.5px dashed var(--gold)', borderRadius: 12, padding: '12px 16px' }}>
                      <Tag size={14} color="var(--gold)" />
                      <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '2px', color: 'var(--text)', flex: 1 }}>{camp.code}</span>
                      <CopyButton code={camp.code} />
                    </div>
                  )}
                  <div style={{ marginTop: 16 }}>
                    <Link href="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
                      İşletmeleri Keşfet <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 48, background: 'linear-gradient(100deg, #18100a 0%, #3a2010 55%, #54320e 100%)', color: 'white', borderRadius: 20, padding: '36px 40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Daha Fazla Fırsat İçin Kayıt Ol</h2>
          <p style={{ fontSize: 14, opacity: 0.75, marginBottom: 24 }}>Üye olarak özel kampanyaları ve yeni fırsatları ilk sen öğren.</p>
          <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, background: 'white', color: 'var(--text)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Ücretsiz Üye Ol <ArrowRight size={14} />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

