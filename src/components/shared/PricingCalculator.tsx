'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/utils'

interface Props {
  monthlyPrice: number
  yearlyPrice: number
}

export default function PricingCalculator({ monthlyPrice, yearlyPrice }: Props) {
  const [isYearly, setIsYearly] = useState(false)
  const price = isYearly ? yearlyPrice / 12 : monthlyPrice
  const savings = Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100)

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setIsYearly(false)}
          style={{
            flex: 1,
            height: 36,
            borderRadius: 8,
            border: 'none',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            background: !isYearly ? 'var(--brand)' : 'transparent',
            color: !isYearly ? 'white' : 'var(--muted-color)',
          }}
        >
          Aylık
        </button>
        <button
          onClick={() => setIsYearly(true)}
          style={{
            flex: 1,
            height: 36,
            borderRadius: 8,
            border: 'none',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            background: isYearly ? 'var(--brand)' : 'transparent',
            color: isYearly ? 'white' : 'var(--muted-color)',
          }}
        >
          Yıllık {savings > 0 && <span style={{ fontSize: 11 }}>(%{savings} indirim)</span>}
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--muted-color)' }}>
          {isYearly ? 'Yıllık ödeme' : 'Aylık ödeme'}
        </span>
        <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--gold)' }}>
          {formatPrice(price)}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted-color)' }}>/ay</span>
        </span>
      </div>
      {isYearly && (
        <div style={{ fontSize: 11, color: 'var(--muted-color)', marginTop: 4, textAlign: 'right' }}>
          Yıllık toplam: {formatPrice(yearlyPrice)}
        </div>
      )}
    </div>
  )
}
