'use client'

import { useState, useEffect } from 'react'
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface Employee {
  id: string
  name: string
  surname: string
}

interface Appointment {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  price: number
  notes?: string | null
  employeeId: string
  customer: { name: string; surname: string; phone?: string | null }
  service: { name: string; duration: number }
  employee: { id: string; name: string; surname: string }
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PENDING:   { bg: '#fef9ee', border: '#f59e0b', text: '#92400e' },
  CONFIRMED: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
  COMPLETED: { bg: '#eff6ff', border: '#60a5fa', text: '#1d4ed8' },
  CANCELLED: { bg: '#fff1f2', border: '#f87171', text: '#b42318' },
  NO_SHOW:   { bg: '#f9fafb', border: '#9ca3af', text: '#6b7280' },
}

const HOUR_HEIGHT = 64 // px per hour
const DAY_START = 8    // 08:00
const DAY_END = 20     // 20:00
const TOTAL_HOURS = DAY_END - DAY_START

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesFromDayStart(t: string): number {
  return timeToMinutes(t) - DAY_START * 60
}

export default function SalonCalendarPage() {
  const [view, setView] = useState<'day' | 'week'>('week')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [dayDate, setDayDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = weekDays[6]

  useEffect(() => {
    fetchData()
  }, [weekStart, dayDate, view])

  async function fetchData() {
    setLoading(true)
    try {
      const [empRes, apptRes] = await Promise.all([
        fetch('/api/salon/employees'),
        view === 'week'
          ? fetch(`/api/salon/appointments?from=${format(weekStart, 'yyyy-MM-dd')}&to=${format(weekEnd, 'yyyy-MM-dd')}`)
          : fetch(`/api/salon/appointments?date=${format(dayDate, 'yyyy-MM-dd')}`),
      ])
      const empData = await empRes.json()
      const apptData = await apptRes.json()
      if (empData.success) setEmployees(empData.data.filter((e: Employee & { isActive?: boolean }) => e.isActive !== false))
      if (apptData.success) setAppointments(apptData.data)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Durum güncellendi')
        setDetailAppt(null)
        fetchData()
      } else toast.error(data.error)
    } finally {
      setUpdating(null)
    }
  }

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => DAY_START + i)

  // For week view: group appointments by employeeId
  function getEmpAppts(empId: string) {
    return appointments.filter((a) => a.employeeId === empId || a.employee.id === empId)
  }

  // For day view: group by employee for selected day
  function getEmpApptsByDay(empId: string, dateStr: string) {
    return appointments.filter(
      (a) => (a.employeeId === empId || a.employee.id === empId) && a.date.startsWith(dateStr)
    )
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayStr = format(dayDate, 'yyyy-MM-dd')

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Takvim</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'white', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
            {(['day', 'week'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '7px 16px', fontSize: 13, fontWeight: 600, border: 0, cursor: 'pointer',
                  background: view === v ? 'var(--brand)' : 'transparent',
                  color: view === v ? 'white' : 'var(--text)',
                }}
              >
                {v === 'day' ? 'Gün' : 'Hafta'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => view === 'week' ? setWeekStart((d) => subWeeks(d, 1)) : setDayDate((d) => subDays(d, 1))}
          style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} />
        </button>

        <div style={{ textAlign: 'center' }}>
          {view === 'week' ? (
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {format(weekStart, 'd MMM', { locale: tr })} — {format(weekEnd, 'd MMM yyyy', { locale: tr })}
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{format(dayDate, 'd MMMM yyyy', { locale: tr })}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>{format(dayDate, 'EEEE', { locale: tr })}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })); setDayDate(new Date()) }}
            style={{ padding: '6px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Bugün
          </button>
          <button
            onClick={() => view === 'week' ? setWeekStart((d) => addWeeks(d, 1)) : setDayDate((d) => addDays(d, 1))}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, height: 500 }} className="animate-pulse" />
      ) : employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-color)', fontSize: 14 }}>
          Çalışan eklenmemiş. Önce Çalışanlar bölümünden çalışan ekleyin.
        </div>
      ) : view === 'week' ? (
        // Week view: employees as columns, time as rows
        <div className="bk-calendar-scroll" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
          {/* Header row */}
          <div className="bk-calendar-inner" style={{ display: 'grid', gridTemplateColumns: `52px repeat(${employees.length}, 1fr)`, borderBottom: '1px solid var(--line)' }}>
            <div style={{ padding: '12px 8px', background: '#fafaf8' }} />
            {employees.map((emp) => (
              <div key={emp.id} style={{ padding: '12px 8px', textAlign: 'center', borderLeft: '1px solid var(--line)', background: '#fafaf8' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--brand)', fontSize: 14, margin: '0 auto 6px' }}>
                  {emp.name[0]}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{emp.name} {emp.surname[0]}.</div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div style={{ position: 'relative', overflow: 'auto', maxHeight: '70vh' }}>
            <div className="bk-calendar-inner" style={{ display: 'grid', gridTemplateColumns: `52px repeat(${employees.length}, 1fr)` }}>
              {/* Time labels */}
              <div>
                {hours.map((h) => (
                  <div key={h} style={{ height: HOUR_HEIGHT, borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'flex-start', paddingTop: 4, paddingLeft: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted-color)', fontWeight: 600 }}>{String(h).padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>

              {/* Employee columns */}
              {employees.map((emp) => {
                const empAppts = getEmpAppts(emp.id)
                return (
                  <div key={emp.id} style={{ borderLeft: '1px solid var(--line)', position: 'relative' }}>
                    {/* Hour lines */}
                    {hours.map((h) => (
                      <div key={h} style={{ height: HOUR_HEIGHT, borderBottom: '1px solid #f0ede8' }} />
                    ))}
                    {/* Appointment blocks */}
                    {empAppts.map((appt) => {
                      const startMins = minutesFromDayStart(appt.startTime)
                      const endMins = minutesFromDayStart(appt.endTime)
                      const top = (startMins / 60) * HOUR_HEIGHT
                      const height = Math.max(((endMins - startMins) / 60) * HOUR_HEIGHT, 28)
                      const col = STATUS_COLORS[appt.status] ?? STATUS_COLORS.PENDING
                      // For week view, also indicate which day
                      const apptDate = new Date(appt.date)
                      const dayLabel = format(apptDate, 'dd/MM', { locale: tr })
                      return (
                        <div
                          key={appt.id}
                          onClick={() => setDetailAppt(appt)}
                          style={{
                            position: 'absolute', left: 3, right: 3,
                            top: top + ((apptDate.getDay() === 0 ? 6 : apptDate.getDay() - 1) * 0), // same for week view (all days stacked)
                            height, borderRadius: 8,
                            background: col.bg, border: `1.5px solid ${col.border}`,
                            padding: '4px 6px', cursor: 'pointer', overflow: 'hidden',
                            zIndex: 1,
                          }}
                        >
                          <div style={{ fontSize: 10, color: col.text, fontWeight: 800, lineHeight: 1.2 }}>
                            {dayLabel} {appt.startTime}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, marginTop: 1 }}>
                            {appt.customer.name} {appt.customer.surname}
                          </div>
                          {height > 40 && (
                            <div style={{ fontSize: 10, color: col.text, opacity: 0.8 }}>{appt.service.name}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        // Day view: employees as columns, time as rows, only today's appointments
        <div className="bk-calendar-scroll" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
          {/* Day header row */}
          <div className="bk-calendar-inner" style={{ display: 'grid', gridTemplateColumns: `52px repeat(${employees.length}, 1fr)`, borderBottom: '1px solid var(--line)', background: '#fafaf8' }}>
            <div style={{ padding: '14px 8px' }} />
            {employees.map((emp) => (
              <div key={emp.id} style={{ padding: '12px 8px', textAlign: 'center', borderLeft: '1px solid var(--line)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--brand)', fontSize: 14, margin: '0 auto 6px' }}>
                  {emp.name[0]}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{emp.name} {emp.surname[0]}.</div>
                <div style={{ fontSize: 11, color: 'var(--muted-color)', marginTop: 2 }}>
                  {getEmpApptsByDay(emp.id, todayStr).length} randevu
                </div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div style={{ overflow: 'auto', maxHeight: '70vh' }}>
            <div className="bk-calendar-inner" style={{ display: 'grid', gridTemplateColumns: `52px repeat(${employees.length}, 1fr)` }}>
              <div>
                {hours.map((h) => (
                  <div key={h} style={{ height: HOUR_HEIGHT, borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'flex-start', paddingTop: 4, paddingLeft: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted-color)', fontWeight: 600 }}>{String(h).padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>

              {employees.map((emp) => {
                const empAppts = getEmpApptsByDay(emp.id, todayStr)
                return (
                  <div key={emp.id} style={{ borderLeft: '1px solid var(--line)', position: 'relative' }}>
                    {hours.map((h) => (
                      <div key={h} style={{ height: HOUR_HEIGHT, borderBottom: '1px solid #f0ede8' }} />
                    ))}
                    {empAppts.map((appt) => {
                      const startMins = minutesFromDayStart(appt.startTime)
                      const endMins = minutesFromDayStart(appt.endTime)
                      const top = (startMins / 60) * HOUR_HEIGHT
                      const height = Math.max(((endMins - startMins) / 60) * HOUR_HEIGHT, 28)
                      const col = STATUS_COLORS[appt.status] ?? STATUS_COLORS.PENDING
                      return (
                        <div
                          key={appt.id}
                          onClick={() => setDetailAppt(appt)}
                          style={{
                            position: 'absolute', left: 3, right: 3, top,
                            height, borderRadius: 8,
                            background: col.bg, border: `1.5px solid ${col.border}`,
                            padding: '4px 6px', cursor: 'pointer', overflow: 'hidden', zIndex: 1,
                          }}
                        >
                          <div style={{ fontSize: 11, color: col.text, fontWeight: 800 }}>
                            {appt.startTime} — {appt.endTime}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 1 }}>
                            {appt.customer.name} {appt.customer.surname}
                          </div>
                          {height > 40 && (
                            <div style={{ fontSize: 10, color: col.text, opacity: 0.8 }}>{appt.service.name}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Appointment detail modal */}
      {detailAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDetailAppt(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            {(() => {
              const col = STATUS_COLORS[detailAppt.status] ?? STATUS_COLORS.PENDING
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{detailAppt.customer.name} {detailAppt.customer.surname}</h3>
                      {detailAppt.customer.phone && <div style={{ fontSize: 13, color: 'var(--muted-color)' }}>{detailAppt.customer.phone}</div>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                      {detailAppt.status === 'PENDING' ? 'Beklemede' : detailAppt.status === 'CONFIRMED' ? 'Onaylandı' : detailAppt.status === 'COMPLETED' ? 'Tamamlandı' : detailAppt.status === 'CANCELLED' ? 'İptal' : 'Gelmedi'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, marginBottom: 20 }}>
                    <Row label="Hizmet" value={`${detailAppt.service.name} (${detailAppt.service.duration} dk)`} />
                    <Row label="Çalışan" value={`${detailAppt.employee.name} ${detailAppt.employee.surname}`} />
                    <Row label="Tarih" value={format(new Date(detailAppt.date), 'd MMMM yyyy EEEE', { locale: tr })} />
                    <Row label="Saat" value={`${detailAppt.startTime} — ${detailAppt.endTime}`} />
                    <Row label="Ücret" value={`₺${Number(detailAppt.price).toFixed(0)}`} highlight />
                    {detailAppt.notes && <Row label="Not" value={detailAppt.notes} />}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {detailAppt.status === 'PENDING' && (
                      <>
                        <button onClick={() => updateStatus(detailAppt.id, 'CONFIRMED')} disabled={!!updating} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', border: '1px solid #86efac', borderRadius: 10, background: 'white', color: '#15803d', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                          <Check size={14} /> Onayla
                        </button>
                        <button onClick={() => updateStatus(detailAppt.id, 'CANCELLED')} disabled={!!updating} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', border: '1px solid #fecaca', borderRadius: 10, background: 'white', color: '#b42318', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                          <X size={14} /> Reddet
                        </button>
                      </>
                    )}
                    {detailAppt.status === 'CONFIRMED' && (
                      <>
                        <button onClick={() => updateStatus(detailAppt.id, 'COMPLETED')} disabled={!!updating} style={{ flex: 1, padding: '8px 0', border: '1px solid #93c5fd', borderRadius: 10, background: 'white', color: '#1d4ed8', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                          Tamamlandı
                        </button>
                        <button onClick={() => updateStatus(detailAppt.id, 'NO_SHOW')} disabled={!!updating} style={{ flex: 1, padding: '8px 0', border: '1px solid var(--line)', borderRadius: 10, background: 'white', color: 'var(--muted-color)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                          Gelmedi
                        </button>
                      </>
                    )}
                    <button onClick={() => setDetailAppt(null)} style={{ flex: 1, padding: '8px 0', border: '1px solid var(--line)', borderRadius: 10, background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      Kapat
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 10 }}>
      <span style={{ color: 'var(--muted-color)', fontSize: 13 }}>{label}</span>
      <span style={{ fontWeight: 700, color: highlight ? 'var(--brand)' : 'var(--text)', fontSize: highlight ? 16 : 14 }}>{value}</span>
    </div>
  )
}
