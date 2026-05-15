'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import BusinessCard from '@/components/shared/BusinessCard'
import { Heart } from 'lucide-react'

interface FavoriteItem {
  id: string
  business: {
    id: string
    name: string
    slug: string
    category: string
    city: string
    district: string
    rating: number
    reviewCount: number
    coverImage?: string | null
  }
}

export default function CustomerFavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/favorites')
      .then((r) => r.json())
      .then((d) => { if (d.success) setFavorites(d.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', marginBottom: 20 }}>Favorilerim</h1>
        <div className="bk-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {[1,2,3,4].map((i) => (
            <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, height: 220 }} className="animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', marginBottom: 20 }}>Favorilerim</h1>
      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-color)' }}>
          <Heart size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Favori işletmeniz yok</h3>
          <Link href="/search" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>İşletmeleri keşfet</Link>
        </div>
      ) : (
        <div className="bk-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {favorites.map((f) => (
            <BusinessCard key={f.id} business={f.business as any} />
          ))}
        </div>
      )}
    </div>
  )
}
