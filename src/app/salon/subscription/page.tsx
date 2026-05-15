'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CreditCard, AlertCircle, Check, Upload } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import ImageUpload from '@/components/ui/ImageUpload'

interface Plan {
  id: string
  name: string
  maxEmployees: number
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
}

interface Subscription {
  id: string
  status: string
  startDate: string
  endDate?: string | null
  plan: Plan
  trialEndsAt?: string | null
}

interface BankAccount {
  id: string
  bankName: string
  accountName: string
  iban: string
  branch?: string | null
}

const PAYMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Aktif', color: '#15803d', bg: '#f0fdf4' },
  TRIAL: { label: 'Deneme Süreci', color: '#92400e', bg: '#fef3c7' },
  EXPIRED: { label: 'Süresi Doldu', color: '#b42318', bg: '#fee2e2' },
  CANCELLED: { label: 'İptal', color: '#6b7280', bg: '#f3f4f6' },
  PENDING_PAYMENT: { label: 'Ödeme Bekleniyor', color: '#1d4ed8', bg: '#eff6ff' },
}

export default function SalonSubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingPayments, setPendingPayments] = useState<any[]>([])

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [subRes, plansRes, banksRes, paymentsRes] = await Promise.all([
        fetch('/api/salon/subscription'),
        fetch('/api/plans'),
        fetch('/api/bank-accounts'),
        fetch('/api/salon/payments'),
      ])
      const [sub, pl, banks, payments] = await Promise.all([subRes.json(), plansRes.json(), banksRes.json(), paymentsRes.json()])
      if (sub.success) setSubscription(sub.data)
      if (pl.success) { setPlans(pl.data); if (pl.data[0]) setSelectedPlan(pl.data[0].id) }
      if (banks.success) setBankAccounts(banks.data)
      if (payments.success) setPendingPayments(payments.data)
    } finally {
      setLoading(false)
    }
  }

  async function submitPayment() {
    if (!selectedPlan || !receiptUrl) {
      toast.error('Plan seçin ve dekont görselini yükleyin')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/salon/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, period, receiptUrl: receiptUrl.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Ödeme bildirimi gönderildi. Admin onayı bekleniyor.')
        setReceiptUrl('')
        fetchData()
      } else toast.error(data.error)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPlanData = plans.find((p) => p.id === selectedPlan)

  if (loading) return <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, height: 300 }} className="animate-pulse" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Abonelik & Ödeme</h1>

      {/* Current subscription */}
      {subscription && (
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={18} style={{ color: 'var(--brand)' }} /> Mevcut Abonelik
          </h2>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted-color)', fontWeight: 600 }}>Plan</div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{subscription.plan.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted-color)', fontWeight: 600 }}>Durum</div>
              <div>
                {(() => {
                  const st = PAYMENT_STATUS[subscription.status] ?? PAYMENT_STATUS.EXPIRED
                  return <span style={{ fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: st.bg, color: st.color, fontSize: 13 }}>{st.label}</span>
                })()}
              </div>
            </div>
            {subscription.endDate && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted-color)', fontWeight: 600 }}>Bitiş Tarihi</div>
                <div style={{ fontWeight: 700 }}>{format(new Date(subscription.endDate), 'd MMMM yyyy', { locale: tr })}</div>
              </div>
            )}
            {subscription.trialEndsAt && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted-color)', fontWeight: 600 }}>Deneme Bitiş</div>
                <div style={{ fontWeight: 700 }}>{format(new Date(subscription.trialEndsAt), 'd MMMM yyyy', { locale: tr })}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted-color)', fontWeight: 600 }}>Maks. Çalışan</div>
              <div style={{ fontWeight: 700 }}>{subscription.plan.maxEmployees}</div>
            </div>
          </div>
        </div>
      )}

      {/* Pending payments */}
      {pendingPayments.length > 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#1d4ed8', fontSize: 14 }}>Bekleyen Ödeme Bildirimleri</div>
          {pendingPayments.map((p: any) => (
            <div key={p.id} style={{ fontSize: 13, color: '#1d4ed8' }}>
              {p.plan?.name} — {format(new Date(p.createdAt), 'd MMM yyyy', { locale: tr })} — Admin onayı bekleniyor
            </div>
          ))}
        </div>
      )}

      {/* Plan selection */}
      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
        <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Plan Seçin</h2>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {['monthly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              style={{ padding: '8px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: `2px solid ${period === p ? 'var(--brand)' : 'var(--line)'}`, background: period === p ? 'var(--brand)' : 'white', color: period === p ? 'white' : 'var(--text)', cursor: 'pointer' }}
            >
              {p === 'monthly' ? 'Aylık' : 'Yıllık'} {p === 'yearly' && <span style={{ fontSize: 12, opacity: 0.8 }}>(%15 indirim)</span>}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {plans.map((plan) => {
            const price = period === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
            const isSelected = selectedPlan === plan.id
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', border: `2px solid ${isSelected ? 'var(--brand)' : 'var(--line)'}`, borderRadius: 14, background: isSelected ? '#f1ede6' : 'white', cursor: 'pointer', textAlign: 'left' }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted-color)', marginTop: 2 }}>Maks. {plan.maxEmployees} çalışan</div>
                  {Array.isArray(plan.features) && (
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {plan.features.map((f: string, i: number) => (
                        <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--surface-2)', color: 'var(--muted-color)' }}>{f}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--brand)' }}>{formatPrice(price)}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>/{period === 'monthly' ? 'ay' : 'yıl'}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bank accounts */}
      {bankAccounts.length > 0 && (
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Ödeme Bilgileri (Havale/EFT)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {bankAccounts.map((ba) => (
              <div key={ba.id} style={{ background: 'var(--surface-2)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>{ba.bankName}</div>
                <div style={{ fontSize: 14, color: 'var(--muted-color)' }}>Hesap Adı: <strong>{ba.accountName}</strong></div>
                <div style={{ fontSize: 14, color: 'var(--muted-color)', fontFamily: 'monospace', marginTop: 4 }}>IBAN: {ba.iban}</div>
                {ba.branch && <div style={{ fontSize: 13, color: 'var(--muted-color)', marginTop: 2 }}>Şube: {ba.branch}</div>}
              </div>
            ))}
          </div>
          {selectedPlanData && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef3c7', borderRadius: 12, fontSize: 14, color: '#92400e', fontWeight: 600 }}>
              Gönderilecek tutar: {formatPrice(period === 'monthly' ? selectedPlanData.monthlyPrice : selectedPlanData.yearlyPrice)}
            </div>
          )}
        </div>
      )}

      {/* Receipt upload */}
      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
        <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={18} style={{ color: 'var(--brand)' }} /> Dekont Bildirimi
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 16 }}>
          Ödemeyi yaptıktan sonra banka dekontunuzu yükleyin.
        </p>
        <ImageUpload
          value={receiptUrl}
          onChange={setReceiptUrl}
          label="Dekont Görseli"
          hint="Banka dekontu veya havale makbuzunu yükleyin"
        />
        <button
          onClick={submitPayment}
          disabled={submitting || !receiptUrl || !selectedPlan}
          style={{ marginTop: 14, width: '100%', height: 46, border: 0, borderRadius: 12, background: receiptUrl && selectedPlan ? 'var(--brand)' : 'var(--line)', color: 'white', fontWeight: 700, fontSize: 14, cursor: submitting || !receiptUrl || !selectedPlan ? 'not-allowed' : 'pointer', opacity: !receiptUrl || !selectedPlan ? 0.5 : 1 }}
        >
          {submitting ? 'Gönderiliyor...' : 'Ödemeyi Bildir'}
        </button>
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted-color)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={13} /> Admin dekontu onayladıktan sonra aboneliğiniz aktifleşir.
        </div>
      </div>
    </div>
  )
}
