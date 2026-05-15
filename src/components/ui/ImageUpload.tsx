'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  hint?: string
  aspectRatio?: string // e.g. "16/9", "1/1"
  height?: number
}

export default function ImageUpload({ value, onChange, label, hint, aspectRatio = '16/9', height = 180 }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        onChange(data.url)
      } else {
        setError(data.error || 'Yükleme başarısız')
      }
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{label}</label>}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: '2px dashed var(--line)',
          borderRadius: 12,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: loading ? 'wait' : 'pointer',
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--surface-2)',
          transition: 'border-color 0.15s',
        }}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt="Yüklenen görsel"
              fill
              style={{ objectFit: 'cover' }}
              unoptimized={value.startsWith('/uploads/')}
            />
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.15s',
            }}
              className="img-upload-overlay"
            >
              <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>Değiştir</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange('') }}
              style={{
                position: 'absolute', top: 8, right: 8,
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 2,
              }}
            >
              <X size={14} color="white" />
            </button>
          </>
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--muted-color)' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Yükleniyor...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--muted-color)', pointerEvents: 'none' }}>
            <Upload size={24} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Görsel Yükle</span>
            <span style={{ fontSize: 12 }}>Tıkla veya sürükle · JPEG, PNG, WebP · Maks 5MB</span>
          </div>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 4 }}>{hint}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleChange} />
      <style>{`.img-upload-overlay:hover { opacity: 1 !important; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
