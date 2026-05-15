import Link from 'next/link'
import { Check } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { formatPrice } from '@/lib/utils'
import PricingCalculator from '@/components/shared/PricingCalculator'

async function getPlans() {
  try {
    return await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
    })
  } catch {
    return []
  }
}

export const metadata = {
  title: 'Fiyatlandırma — Bakımla',
  description: 'İşletmeniz için en uygun planı seçin.',
}

export default async function PricingPage() {
  const plans = await getPlans()

  const faqs = [
    { q: 'Ödeme nasıl yapılır?', a: 'Ödeme havale/EFT yöntemiyle yapılır. Dekontu sisteme yüklersiniz, ekibimiz onaylar.' },
    { q: 'Ücretsiz deneme süresi ne kadar?', a: 'Tüm planlara 14 gün ücretsiz deneme dahildir. Kredi kartı gerekmez.' },
    { q: 'Personel sayısını sonradan değiştirebilir miyim?', a: 'Evet, dilediğiniz zaman planınızı yükselterek daha fazla personel ekleyebilirsiniz.' },
    { q: 'İptal edebilir miyim?', a: 'Evet, aboneliğinizi dilediğiniz zaman iptal edebilirsiniz. Kalan süre için ücret iadesi yapılmaz.' },
  ]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--brand)', marginBottom: 12 }}>Şeffaf Fiyatlandırma</h1>
          <p style={{ fontSize: 16, color: 'var(--muted-color)', maxWidth: 500, margin: '0 auto' }}>
            Küçük işletmelerden büyük zincir salonlara, herkes için doğru plan.
          </p>
        </div>

        {plans.length > 0 ? (
          <div className="bk-grid-3" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`, gap: 24, marginBottom: 48 }}>
            {plans.map((plan, idx) => {
              const features = plan.features as string[]
              const isMiddle = plans.length === 3 && idx === 1
              const monthlyPrice = typeof plan.monthlyPrice === 'object' && 'toNumber' in plan.monthlyPrice
                ? (plan.monthlyPrice as { toNumber: () => number }).toNumber()
                : Number(plan.monthlyPrice)
              const yearlyPrice = typeof plan.yearlyPrice === 'object' && 'toNumber' in plan.yearlyPrice
                ? (plan.yearlyPrice as { toNumber: () => number }).toNumber()
                : Number(plan.yearlyPrice)

              return (
                <div
                  key={plan.id}
                  style={{
                    background: 'white',
                    borderRadius: 18,
                    border: isMiddle ? '2px solid var(--gold)' : '1px solid var(--line)',
                    padding: 24,
                    position: 'relative',
                    boxShadow: 'var(--bk-shadow)',
                  }}
                >
                  {isMiddle && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 16px', borderRadius: 99, background: 'var(--gold)', color: 'white' }}>Popüler</span>
                    </div>
                  )}
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand)', marginBottom: 4 }}>{plan.name}</h3>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 32, fontWeight: 800 }}>{formatPrice(monthlyPrice)}</span>
                    <span style={{ fontSize: 13, color: 'var(--muted-color)', marginLeft: 4 }}>/ay</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-color)', marginBottom: 16 }}>
                    Maks. {plan.maxEmployees} personel
                  </div>

                  <PricingCalculator monthlyPrice={monthlyPrice} yearlyPrice={yearlyPrice} />

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                        <Check size={14} color="var(--green)" /> {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/auth/register"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 44,
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: 'none',
                      color: 'white',
                      background: isMiddle ? 'var(--gold)' : 'var(--brand)',
                    }}
                  >
                    14 Gün Ücretsiz Deneyin
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted-color)' }}>
            Fiyatlandırma planları yakında yayınlanacak.
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 48, fontSize: 14, color: 'var(--muted-color)' }}>
          14 gün ücretsiz deneme · Kredi kartı gerektirmez · Dilediğiniz zaman iptal
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24, color: 'var(--brand)' }}>Sık Sorulan Sorular</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 18, border: '1px solid var(--line)', padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{faq.q}</h3>
                <p style={{ fontSize: 14, color: 'var(--muted-color)', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
