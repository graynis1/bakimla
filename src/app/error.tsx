'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>⚠️</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--brand)', marginBottom: 12 }}>Bir hata oluştu</h2>
        <p style={{ fontSize: 15, color: 'var(--muted-color)', marginBottom: 28 }}>Beklenmedik bir hata meydana geldi. Lütfen tekrar deneyin.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={reset} style={{ height: 48, padding: '0 28px', borderRadius: 14, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 15, border: 0, cursor: 'pointer' }}>
            Tekrar Dene
          </button>
          <Link href="/" style={{ height: 48, padding: '0 28px', borderRadius: 14, border: '1px solid var(--line)', background: 'white', color: 'var(--text)', fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
