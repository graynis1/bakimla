'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

interface HolidayItem {
  id: string
  date: string
  description?: string | null
}

export default function SalonHolidaysPage() {
  const [holidays, setHolidays] = useState<HolidayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetchHolidays() }, [])

  async function fetchHolidays() {
    const res = await fetch('/api/salon/holidays')
    const data = await res.json()
    if (data.success) setHolidays(data.data)
    setLoading(false)
  }

  async function addHoliday() {
    if (!date) return
    setAdding(true)
    try {
      const res = await fetch('/api/salon/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, description: description.trim() || null }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Tatil günü eklendi')
        setDate('')
        setDescription('')
        fetchHolidays()
      } else toast.error(data.error)
    } finally {
      setAdding(false)
    }
  }

  async function deleteHoliday(id: string) {
    const res = await fetch(`/api/salon/holidays/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) { toast.success('Tatil günü silindi'); fetchHolidays() }
    else toast.error(data.error)
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', marginBottom: 8 }}>Tatil Günleri</h1>
      <p style={{ fontSize: 14, color: 'var(--muted-color)', marginBottom: 20 }}>Tatil günlerinde randevu alınamaz.</p>

      {/* Add form */}
      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>Tatil Ekle</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ flex: 1, minWidth: 160, padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14 }}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Açıklama (isteğe bağlı)"
            style={{ flex: 2, padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14 }}
          />
          <button
            onClick={addHoliday}
            disabled={adding || !date}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 20px', border: 0, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, cursor: adding ? 'not-allowed' : 'pointer', flexShrink: 0 }}
          >
            <Plus size={16} /> Ekle
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map((i) => <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 14, height: 52 }} className="animate-pulse" />)}
        </div>
      ) : holidays.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-color)', fontSize: 14 }}>Tanımlı tatil günü bulunmuyor.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {holidays.sort((a, b) => a.date.localeCompare(b.date)).map((h) => (
            <div key={h.id} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{format(new Date(h.date + 'T12:00:00'), 'd MMMM yyyy EEEE', { locale: tr })}</span>
                {h.description && <span style={{ fontSize: 13, color: 'var(--muted-color)', marginLeft: 8 }}>— {h.description}</span>}
              </div>
              <button onClick={() => deleteHoliday(h.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b42318' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
