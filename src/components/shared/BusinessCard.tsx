'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MapPin, Star, Heart } from 'lucide-react'
import { categoryLabels } from '@/lib/utils'
import type { BusinessCategory } from '@/generated/prisma'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface BusinessCardProps {
  business: {
    id: string
    name: string
    slug: string
    category: BusinessCategory
    city: string
    district: string
    rating: number
    reviewCount: number
    coverImage?: string | null
  }
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const { data: session } = useSession()
  const [favorited, setFavorited] = useState(false)
  const [toggling, setToggling] = useState(false)

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      toast.error('Favorilere eklemek için giriş yapmanız gerekiyor')
      return
    }

    setToggling(true)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id }),
      })
      const data = await res.json()
      if (data.success) {
        setFavorited(data.data.isFavorited)
        toast.success(data.data.isFavorited ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı')
      }
    } finally {
      setToggling(false)
    }
  }

  return (
    <Link
      href={`/salon/${business.slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: 'white', border: '1px solid var(--line)', borderRadius: 18, overflow: 'hidden', transition: 'box-shadow 0.15s' }}
    >
      <div style={{ position: 'relative' }}>
        {business.coverImage ? (
          <div style={{ height: 168, background: `url(${business.coverImage}) center/cover` }} />
        ) : (
          <div style={{ height: 168, background: 'linear-gradient(135deg, #f1ede6, #e8e2d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>✂️</div>
        )}
        <button
          onClick={toggleFavorite}
          disabled={toggling}
          style={{ position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: '50%', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          <Heart size={16} fill={favorited ? '#b42318' : 'none'} color={favorited ? '#b42318' : '#6b7280'} />
        </button>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-color)', marginBottom: 4 }}>
          {categoryLabels[business.category]}
        </div>
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--brand)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {business.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted-color)' }}>
            <MapPin size={12} /> {business.district}, {business.city}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#d69b22', fontWeight: 700 }}>
            <Star size={12} fill="currentColor" /> {business.rating.toFixed(1)}
            <span style={{ color: 'var(--muted-color)', fontWeight: 400 }}>({business.reviewCount})</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
