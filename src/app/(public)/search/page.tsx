'use client'

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BusinessCard from '@/components/shared/BusinessCard'
import { categoryLabels } from '@/lib/utils'
import { cityList, getDistricts } from '@/lib/locations'
import { getApproxCoords, haversineKm } from '@/components/shared/MapView'
import { Search, SlidersHorizontal, X, MapPin, Loader, LayoutGrid, Map, Navigation } from 'lucide-react'
import type { BusinessCategory } from '@/generated/prisma'

const MapView = dynamic(() => import('@/components/shared/MapView'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', minHeight: 480, background: 'var(--surface-2)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-color)', fontSize: 14, flexDirection: 'column', gap: 8 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Harita yükleniyor...
    </div>
  ),
})

const CATEGORIES = Object.entries(categoryLabels) as [BusinessCategory, string][]

interface Business {
  id: string; name: string; slug: string; category: BusinessCategory
  city: string; district: string; rating: number; reviewCount: number; coverImage?: string | null
}

function formatDist(km: number): string {
  return km < 1 ? `${(km * 1000).toFixed(0)} m` : km < 10 ? `${km.toFixed(1)} km` : `${km.toFixed(0)} km`
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [activeId, setActiveId] = useState<string | null>(null)

  const [query, setQuery] = useState(searchParams.get('query') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [district, setDistrict] = useState(searchParams.get('district') || '')
  const [category, setCategory] = useState<string>(searchParams.get('category') || '')
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'rating')
  const [page, setPage] = useState(1)
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null)

  // Compute distances for all businesses when userCoords available
  const withDist = useMemo(() => {
    return businesses.map((b) => {
      if (!userCoords) return { ...b, distKm: null as number | null }
      const coords = getApproxCoords(b)
      const distKm = coords ? haversineKm(userCoords[0], userCoords[1], coords[0], coords[1]) : null
      return { ...b, distKm }
    })
  }, [businesses, userCoords])

  // Sort by proximity when selected
  const sorted = useMemo(() => {
    if (sortBy === 'proximity' && userCoords) {
      return [...withDist].sort((a, b) => (a.distKm ?? 9999) - (b.distKm ?? 9999))
    }
    return withDist
  }, [withDist, sortBy, userCoords])

  async function fetchBusinesses(p = 1) {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set('query', query)
    if (city) params.set('city', city)
    if (district) params.set('district', district)
    if (category) params.set('category', category)
    if (minRating) params.set('minRating', minRating)
    if (sortBy !== 'proximity') params.set('sortBy', sortBy)
    else params.set('sortBy', 'rating')
    params.set('page', String(p))
    if (viewMode === 'map') params.set('limit', '100')
    try {
      const res = await fetch(`/api/businesses/search?${params.toString()}`)
      const data = await res.json()
      if (data.success) { setBusinesses(data.data.businesses); setTotal(data.data.total); setPage(p) }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchBusinesses(1) }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchBusinesses(1)
    const p = new URLSearchParams()
    if (query) p.set('query', query)
    if (city) p.set('city', city)
    if (category) p.set('category', category)
    router.push(`/search?${p.toString()}`)
  }

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          setUserCoords([coords.latitude, coords.longitude])
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=tr`
          )
          const data = await res.json()
          const detectedCity = data.address?.province || data.address?.state || ''
          const matched = cityList.find((c) => c.toLowerCase() === detectedCity.toLowerCase())
          if (matched) { setCity(matched); setDistrict(''); setTimeout(() => fetchBusinesses(1), 100) }
          // Switch to map view automatically when location detected
          setViewMode('map')
        } catch { /* silent */ } finally { setLocating(false) }
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', background: 'white', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }

  const isMapMode = viewMode === 'map'

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 1380, margin: '0 auto', padding: '24px 20px' }}>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid var(--line)', borderRadius: 14, padding: '0 16px', height: 50 }}>
            <Search size={17} color="var(--muted-color)" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="İşletme, hizmet veya kategori ara..."
              style={{ flex: 1, border: 0, outline: 'none', fontSize: 14, background: 'transparent', color: 'var(--text)' }} />
            {query && <button type="button" onClick={() => setQuery('')} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={15} color="var(--muted-color)" /></button>}
          </div>
          <button type="button" onClick={detectLocation} disabled={locating}
            style={{ display: 'flex', alignItems: 'center', gap: 8, height: 50, padding: '0 18px', border: `1px solid ${userCoords ? '#2563eb' : 'var(--line)'}`, borderRadius: 14, background: userCoords ? '#eff6ff' : 'white', color: userCoords ? '#2563eb' : 'var(--muted-color)', fontWeight: 600, fontSize: 14, cursor: locating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {locating ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Navigation size={16} />}
            {locating ? 'Tespit ediliyor...' : userCoords ? city || 'Konumum' : 'Konumumu Bul'}
          </button>
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, height: 50, padding: '0 18px', border: `1px solid ${showFilters ? 'var(--brand)' : 'var(--line)'}`, borderRadius: 14, background: showFilters ? 'var(--brand)' : 'white', color: showFilters ? 'white' : 'var(--text)', fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <SlidersHorizontal size={16} /> Filtreler
          </button>
          <button type="submit" style={{ height: 50, padding: '0 28px', borderRadius: 14, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Ara
          </button>
        </form>

        {/* Active filters + view toggle */}
        <div className="bk-search-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {city && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 99, fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
                <MapPin size={11} /> {city}{district ? ` / ${district}` : ''}
                <button onClick={() => { setCity(''); setDistrict('') }} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: 2 }}><X size={11} /></button>
              </span>
            )}
            {category && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--gold-soft)', border: '1px solid #e8d5b0', borderRadius: 99, fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>
                {categoryLabels[category as BusinessCategory]}
                <button onClick={() => setCategory('')} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={11} /></button>
              </span>
            )}
            {minRating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#fef9ee', border: '1px solid #fde68a', borderRadius: 99, fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                {minRating}★ ve üzeri
                <button onClick={() => setMinRating('')} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={11} /></button>
              </span>
            )}
            {!loading && <span style={{ fontSize: 13, color: 'var(--muted-color)', fontWeight: 500 }}>{total} işletme</span>}
          </div>

          <div className="bk-view-toggle" style={{ display: 'flex', background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: 4, gap: 4 }}>
            <button onClick={() => setViewMode('list')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9, border: 0, background: viewMode === 'list' ? 'var(--brand)' : 'transparent', color: viewMode === 'list' ? 'white' : 'var(--muted-color)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              <LayoutGrid size={14} /> Liste
            </button>
            <button onClick={() => { setViewMode('map'); if (viewMode !== 'map') fetchBusinesses(1) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9, border: 0, background: viewMode === 'map' ? 'var(--brand)' : 'transparent', color: viewMode === 'map' ? 'white' : 'var(--muted-color)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              <Map size={14} /> Harita
            </button>
          </div>
        </div>

        {/* Filter sidebar + results grid */}
        <div className="bk-search-layout" style={{ display: 'grid', gridTemplateColumns: showFilters ? '220px 1fr' : '1fr', gap: 20 }}>

          {/* Sidebar */}
          {showFilters && (
            <div className="bk-filter-sidebar" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20, height: 'fit-content', position: 'sticky', top: 80 }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 20 }}>Filtreler</div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--muted-color)', letterSpacing: '0.5px' }}>KATEGORİ</div>
                {CATEGORIES.map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 14, cursor: 'pointer' }}>
                    <input type="radio" name="category" value={key} checked={category === key} onChange={() => setCategory(category === key ? '' : key)} style={{ accentColor: 'var(--gold)' }} />
                    {label}
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--muted-color)', letterSpacing: '0.5px' }}>ŞEHİR</div>
                <select value={city} onChange={(e) => { setCity(e.target.value); setDistrict('') }} style={inp}>
                  <option value="">Tüm şehirler</option>
                  {cityList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {city && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--muted-color)', letterSpacing: '0.5px' }}>İLÇE</div>
                  <select value={district} onChange={(e) => setDistrict(e.target.value)} style={inp}>
                    <option value="">Tüm ilçeler</option>
                    {getDistricts(city).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--muted-color)', letterSpacing: '0.5px' }}>MİN. PUAN</div>
                {[4, 3, 2].map((r) => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 14, cursor: 'pointer' }}>
                    <input type="radio" name="minRating" value={r} checked={minRating === String(r)} onChange={() => setMinRating(minRating === String(r) ? '' : String(r))} style={{ accentColor: 'var(--gold)' }} />
                    {r}★ ve üzeri
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--muted-color)', letterSpacing: '0.5px' }}>SIRALAMA</div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={inp}>
                  <option value="rating">En Yüksek Puan</option>
                  <option value="reviewCount">En Fazla Yorum</option>
                  <option value="newest">En Yeni</option>
                  {userCoords && <option value="proximity">📍 En Yakın</option>}
                </select>
              </div>

              <button onClick={() => fetchBusinesses(1)} style={{ width: '100%', height: 44, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, border: 0, cursor: 'pointer', marginBottom: 8 }}>
                Filtrele
              </button>
              {(city || district || category || minRating) && (
                <button onClick={() => { setCity(''); setDistrict(''); setCategory(''); setMinRating(''); setTimeout(() => fetchBusinesses(1), 50) }} style={{ width: '100%', height: 40, borderRadius: 12, background: 'transparent', color: 'var(--muted-color)', fontWeight: 600, fontSize: 13, border: '1px solid var(--line)', cursor: 'pointer' }}>
                  Temizle
                </button>
              )}
            </div>
          )}

          {/* Results */}
          <div className="bk-search-results">

            {/* === MAP MODE === */}
            {isMapMode && (
              <div style={{ display: 'grid', gap: 16, height: 'calc(100vh - 200px)', minHeight: 500 }} className="bk-map-split">

                {/* Scrollable list */}
                <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 14, height: 80 }} className="animate-pulse" />
                    ))
                  ) : sorted.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-color)' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Sonuç bulunamadı</div>
                      <div style={{ fontSize: 13 }}>Farklı filtreler deneyin.</div>
                    </div>
                  ) : (
                    sorted.map((b) => (
                      <a
                        key={b.id}
                        href={`/salon/${b.slug}`}
                        onMouseEnter={() => setActiveId(b.id)}
                        onMouseLeave={() => setActiveId(null)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                          background: activeId === b.id ? 'var(--gold-soft)' : 'white',
                          border: `1px solid ${activeId === b.id ? 'var(--gold)' : 'var(--line)'}`,
                          borderRadius: 14, textDecoration: 'none', color: 'var(--text)',
                          transition: 'all 0.15s', cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)' }}>
                          {b.coverImage
                            ? <img src={b.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏪</div>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted-color)', marginBottom: 3 }}>{b.district}, {b.city}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>★ {Number(b.rating).toFixed(1)}</span>
                            <span style={{ fontSize: 11, color: 'var(--muted-color)' }}>({b.reviewCount})</span>
                          </div>
                        </div>
                        {b.distKm != null && (
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', flexShrink: 0, textAlign: 'right', lineHeight: 1.3 }}>
                            📍 {formatDist(b.distKm)}
                          </div>
                        )}
                      </a>
                    ))
                  )}
                </div>

                {/* Sticky map */}
                <div style={{ position: 'sticky', top: 80, height: 'calc(100vh - 220px)', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--line)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                  <MapView
                    businesses={businesses}
                    city={city}
                    userLocation={userCoords}
                    activeId={activeId}
                    onSelect={(id) => { setActiveId(id); document.getElementById(`biz-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }}
                  />
                  {userCoords && (
                    <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'white', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#2563eb', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                      Konumunuz gösteriliyor
                    </div>
                  )}
                  {sortBy !== 'proximity' && userCoords && (
                    <button
                      onClick={() => setSortBy('proximity')}
                      style={{ position: 'absolute', top: 16, left: 16, background: 'white', border: '1px solid #bfdbfe', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, color: '#2563eb', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Navigation size={12} /> Yakına Göre Sırala
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* === LIST MODE === */}
            {!isMapMode && (
              <>
                {loading ? (
                  <div className="bk-cards-grid" style={{ display: 'grid', gridTemplateColumns: showFilters ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 18 }}>
                    {[1,2,3,4,5,6].map((i) => (
                      <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18 }}>
                        <div style={{ height: 168, background: 'var(--surface-2)', borderRadius: '18px 18px 0 0' }} className="animate-pulse" />
                        <div style={{ padding: 16 }}>
                          <div style={{ height: 16, background: 'var(--surface-2)', borderRadius: 8, marginBottom: 8 }} className="animate-pulse" />
                          <div style={{ height: 12, background: 'var(--surface-2)', borderRadius: 8, width: '60%' }} className="animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sorted.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted-color)' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                    <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Sonuç bulunamadı</h3>
                    <p style={{ fontSize: 14 }}>Farklı filtreler deneyebilirsiniz.</p>
                  </div>
                ) : (
                  <div className="bk-cards-grid" style={{ display: 'grid', gridTemplateColumns: showFilters ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 18 }}>
                    {sorted.map((b) => (
                      <div key={b.id} style={{ position: 'relative' }}>
                        <BusinessCard business={b} />
                        {b.distKm != null && (
                          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.95)', border: '1px solid #bfdbfe', borderRadius: 8, padding: '3px 8px', fontSize: 11, fontWeight: 700, color: '#2563eb', pointerEvents: 'none' }}>
                            📍 {formatDist(b.distKm)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {total > 12 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28, flexWrap: 'wrap' }}>
                    {Array.from({ length: Math.min(Math.ceil(total / 12), 10) }, (_, i) => (
                      <button key={i} onClick={() => fetchBusinesses(i + 1)}
                        style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${page === i + 1 ? 'var(--brand)' : 'var(--line)'}`, background: page === i + 1 ? 'var(--brand)' : 'white', color: page === i + 1 ? 'white' : 'var(--text)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <style>{`
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        @media (max-width:900px) {
          .bk-map-split { grid-template-columns:1fr !important; height:auto !important; }
          .bk-map-split > div:first-child { max-height:400px; }
          .bk-map-split > div:last-child { position:relative !important; top:0 !important; height:380px !important; }
        }
        @media (max-width:768px) {
          .bk-search-layout { grid-template-columns:1fr !important; }
          .bk-filter-sidebar { position:static !important; top:auto !important; }
        }
        @media (max-width:700px) {
          .bk-cards-grid { grid-template-columns:repeat(2,1fr) !important; }
        }
        @media (max-width:540px) {
          .bk-search-topbar { flex-direction:column !important; align-items:stretch !important; }
          .bk-search-topbar > * { width:100% !important; }
          .bk-view-toggle { align-self:flex-end; width:auto !important; }
        }
        @media (max-width:480px) {
          .bk-cards-grid { grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <SearchContent />
    </Suspense>
  )
}
