'use client'

import { useEffect, useRef } from 'react'

interface Business {
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

interface MapViewProps {
  businesses: Business[]
  city?: string
  userLocation?: [number, number] | null
  activeId?: string | null
  onSelect?: (id: string) => void
}

const CITY_COORDS: Record<string, [number, number]> = {
  'İstanbul':   [41.015, 28.979],
  'Ankara':     [39.925, 32.866],
  'İzmir':      [38.418, 27.129],
  'Bursa':      [40.183, 29.061],
  'Antalya':    [36.898, 30.713],
  'Adana':      [37.000, 35.321],
  'Konya':      [37.872, 32.485],
  'Gaziantep':  [37.064, 37.383],
  'Kayseri':    [38.730, 35.482],
  'Mersin':     [36.800, 34.633],
  'Diyarbakır': [37.909, 40.230],
  'Eskişehir':  [39.776, 30.520],
  'Samsun':     [41.286, 36.330],
  'Trabzon':    [41.002, 39.717],
}

const CATEGORY_COLORS: Record<string, string> = {
  BARBER:          '#0f1724',
  HAIR_SALON:      '#7c3aed',
  NAIL_SALON:      '#ec4899',
  BEAUTY_CENTER:   '#f59e0b',
  SKIN_CARE:       '#10b981',
  SPA:             '#0891b2',
  MASSAGE:         '#6366f1',
  REFLEXOLOGY:     '#84cc16',
  EPILATION:       '#f97316',
  FITNESS:         '#dc2626',
  TEETH_WHITENING: '#3b82f6',
  BROW_LASH:       '#8b5cf6',
  YOGA_PILATES:    '#22c55e',
  PET_GROOMING:    '#fb923c',
  DIETITIAN:       '#4ade80',
  PHYSIOTHERAPY:   '#60a5fa',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  BARBER: '✂️', HAIR_SALON: '💇', NAIL_SALON: '💅', BEAUTY_CENTER: '◎',
  SKIN_CARE: '🧴', SPA: '🧖', MASSAGE: '💆', REFLEXOLOGY: '🦶',
  EPILATION: '⌁', FITNESS: '🏋️', TEETH_WHITENING: '🦷', BROW_LASH: '👁️',
  YOGA_PILATES: '🧘', PET_GROOMING: '🐾', DIETITIAN: '🥗', PHYSIOTHERAPY: '🏥',
}

function hashCode(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (h * 33 ^ str.charCodeAt(i)) >>> 0
  return h
}

function getApproxCoords(biz: { name: string; city: string }): [number, number] | null {
  const center = CITY_COORDS[biz.city]
  if (!center) return null
  const h = hashCode(biz.name + biz.city)
  const lat = center[0] + ((h & 0xff) - 128) * 0.0003
  const lng = center[1] + (((h >> 8) & 0xff) - 128) * 0.00045
  return [lat, lng]
}

function buildMarkerHtml(biz: Business, active = false): string {
  const color = CATEGORY_COLORS[biz.category] ?? '#c9a84c'
  const emoji = CATEGORY_EMOJIS[biz.category] ?? '📍'
  const name = biz.name.length > 16 ? biz.name.slice(0, 16) + '…' : biz.name
  const size = active ? 58 : 50
  const shadow = active
    ? `0 6px 24px ${color}88, 0 0 0 3px ${color}44`
    : '0 4px 16px rgba(0,0,0,0.28)'

  return `
<div style="display:flex;flex-direction:column;align-items:flex-start;cursor:pointer;transform-origin:bottom left;${active ? 'transform:scale(1.12)' : ''}">
  <div style="
    width:${size}px;height:${size}px;
    border-radius:${active ? 16 : 12}px ${active ? 16 : 12}px ${active ? 16 : 12}px 0;
    overflow:hidden;
    border:${active ? 3 : 2.5}px solid ${color};
    box-shadow:${shadow};
    background:${color}20;
    transition:all 0.2s;
  ">${biz.coverImage
    ? `<img src="${biz.coverImage}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${color}18;font-size:${active ? 26 : 22}px">${emoji}</div>`
  }</div>
  <div style="
    margin-top:3px;
    background:white;
    color:#1a1a1a;
    padding:2px 7px;
    border-radius:6px;
    font-size:11px;
    font-weight:800;
    white-space:nowrap;
    box-shadow:0 2px 8px rgba(0,0,0,0.14);
    font-family:Inter,system-ui,sans-serif;
    letter-spacing:-0.2px;
    border:1px solid ${color}33;
  ">${name}</div>
</div>`
}

function buildPopupHtml(biz: Business, distKm?: number): string {
  const color = CATEGORY_COLORS[biz.category] ?? '#c9a84c'
  const stars = '★'.repeat(Math.round(Number(biz.rating))) + '☆'.repeat(5 - Math.round(Number(biz.rating)))
  const distLabel = distKm != null ? `<div style="font-size:11px;color:${color};font-weight:700;margin-bottom:8px">📍 ~${distKm < 1 ? (distKm * 1000).toFixed(0) + ' m' : distKm.toFixed(1) + ' km'} uzakta</div>` : ''
  return `
<div style="font-family:Inter,system-ui,sans-serif;width:200px;padding:2px">
  ${biz.coverImage ? `<div style="width:100%;height:110px;border-radius:10px;overflow:hidden;margin-bottom:12px"><img src="${biz.coverImage}" style="width:100%;height:100%;object-fit:cover;display:block" /></div>` : ''}
  <div style="font-weight:800;font-size:14px;color:#0f1724;margin-bottom:3px;line-height:1.3">${biz.name}</div>
  <div style="font-size:11px;color:${color};font-weight:700;margin-bottom:3px">${biz.district}, ${biz.city}</div>
  ${distLabel}
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
    <span style="color:#f59e0b;font-size:13px;letter-spacing:-1px">${stars}</span>
    <span style="font-size:12px;font-weight:700;color:#0f1724">${Number(biz.rating).toFixed(1)}</span>
    <span style="font-size:11px;color:#9ca3af">(${biz.reviewCount})</span>
  </div>
  <a href="/salon/${biz.slug}" style="display:block;background:${color};color:white;text-align:center;padding:9px;border-radius:10px;font-size:12px;font-weight:800;text-decoration:none;letter-spacing:-0.2px">Profili Gör →</a>
</div>`
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletMap = any

export default function MapView({ businesses, city, userLocation, activeId, onSelect }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap>(null)
  const LRef = useRef<LeafletMap>(null)
  const markersRef = useRef<LeafletMap[]>([])
  const userMarkerRef = useRef<LeafletMap>(null)

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) return
    let mounted = true

    async function init() {
      const L = (await import('leaflet')).default
      if (!mounted || mapInstanceRef.current) return
      LRef.current = L

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center = CITY_COORDS[city ?? ''] ?? [39.0, 35.0]
      const zoom = city && CITY_COORDS[city] ? 13 : 6

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: false,
      })
      mapInstanceRef.current = map

      // Modern map tiles (CartoDB light - clean and modern)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map)

      // Subtle attribution
      L.control.attribution({ position: 'bottomright', prefix: '' })
        .addAttribution('© <a href="https://www.openstreetmap.org/copyright" style="color:#9ca3af">OSM</a> © <a href="https://carto.com/" style="color:#9ca3af">CARTO</a>')
        .addTo(map)

      // Custom zoom control
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      map.setView(center, zoom)
    }

    init().catch(console.error)

    return () => {
      mounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update map center when city changes
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const center = CITY_COORDS[city ?? ''] ?? [39.0, 35.0]
    const zoom = city && CITY_COORDS[city] ? 13 : 6
    mapInstanceRef.current.setView(center, zoom, { animate: true, duration: 0.8 })
  }, [city])

  // Update markers when businesses or activeId changes
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return
    const L = LRef.current
    const map = mapInstanceRef.current

    markersRef.current.forEach((m: LeafletMap) => m.remove())
    markersRef.current = []

    businesses.forEach((biz) => {
      const coords = getApproxCoords(biz)
      if (!coords) return

      const active = biz.id === activeId
      const icon = L.divIcon({ className: '', html: buildMarkerHtml(biz, active), iconAnchor: [0, active ? 68 : 60] })
      const marker = L.marker(coords, { icon, zIndexOffset: active ? 1000 : 0 }).addTo(map)

      const distKm = userLocation ? haversineKm(userLocation[0], userLocation[1], coords[0], coords[1]) : undefined
      marker.bindPopup(buildPopupHtml(biz, distKm), { maxWidth: 240, closeButton: true, className: 'bk-popup' })

      marker.on('click', () => {
        onSelect?.(biz.id)
        marker.openPopup()
      })

      markersRef.current.push(marker)
    })
  }, [businesses, activeId, userLocation, onSelect])

  // Update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return
    const L = LRef.current
    const map = mapInstanceRef.current

    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null }

    if (userLocation) {
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:22px;height:22px">
          <div style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.2);animation:bkPulseRing 1.8s infinite"></div>
          <div style="position:absolute;inset:3px;border-radius:50%;background:#2563eb;border:2.5px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.5)"></div>
        </div>`,
        iconAnchor: [11, 11],
      })
      const m = L.marker(userLocation, { icon: userIcon, zIndexOffset: 2000 }).addTo(map)
      m.bindPopup('<div style="font-family:Inter,sans-serif;font-weight:700;font-size:13px;color:#2563eb">📍 Konumunuz</div>', { maxWidth: 160 })
      userMarkerRef.current = m
    }
  }, [userLocation])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        @keyframes bkPulseRing {
          0%   { transform:scale(0.6); opacity:0.8 }
          70%  { transform:scale(2.2); opacity:0 }
          100% { transform:scale(2.2); opacity:0 }
        }
        .bk-popup .leaflet-popup-content-wrapper {
          border-radius: 18px !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.18) !important;
          border: 1px solid #e8e0d0 !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .bk-popup .leaflet-popup-content {
          margin: 14px !important;
        }
        .bk-popup .leaflet-popup-tip-container { display:none }
        .bk-popup .leaflet-popup-close-button {
          top:8px !important; right:10px !important;
          font-size:18px !important; color:#9ca3af !important;
          font-weight:300 !important;
        }
        .leaflet-control-zoom { border:none !important; box-shadow:0 2px 12px rgba(0,0,0,0.12) !important; border-radius:12px !important; overflow:hidden; }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out { width:34px !important; height:34px !important; line-height:34px !important; font-size:18px !important; color:#0f1724 !important; border:none !important; }
        .leaflet-control-attribution { background:rgba(255,255,255,0.7) !important; border-radius:6px !important; font-size:10px !important; }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 480, borderRadius: 18 }} />
    </>
  )
}

export { getApproxCoords, haversineKm, CITY_COORDS }
