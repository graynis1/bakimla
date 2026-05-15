'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { formatPrice, formatDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Check, Clock, User, Scissors, Calendar, Star } from 'lucide-react'
import { toast } from 'sonner'
import { format, addDays, startOfDay, startOfMonth, endOfMonth, startOfWeek, addWeeks, isSameMonth, isBefore, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Service {
  id: string
  name: string
  description?: string | null
  duration: number
  price: number
}

interface Employee {
  id: string
  name: string
  surname: string
  title?: string | null
  bio?: string | null
  services: { service: Service }[]
}

interface Business {
  id: string
  name: string
  slug: string
  services: Service[]
  employees: Employee[]
}

const STEPS = ['Hizmet', 'Çalışan', 'Tarih', 'Saat', 'Onay']

function BookingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const businessId = searchParams.get('businessId')

  const [step, setStep] = useState(0)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/login?callbackUrl=/booking?businessId=${businessId}`)
      return
    }
    if (!businessId) {
      router.push('/')
      return
    }
    fetchBusiness()
  }, [status, businessId])

  async function fetchBusiness() {
    try {
      const res = await fetch(`/api/businesses/id/${businessId}`)
      const data = await res.json()
      if (data.success) setBusiness(data.data)
      else router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const eligibleEmployees = selectedService
    ? business?.employees.filter((e) => e.services.some((es) => es.service.id === selectedService.id)) ?? []
    : []

  async function fetchSlots(date: string) {
    if (!selectedEmployee || !selectedService || !businessId) return
    setSlotsLoading(true)
    setAvailableSlots([])
    setSelectedSlot('')
    try {
      const res = await fetch(
        `/api/appointments/available-slots?businessId=${businessId}&employeeId=${selectedEmployee.id}&serviceId=${selectedService.id}&date=${date}`
      )
      const data = await res.json()
      if (data.success) setAvailableSlots(data.data)
    } finally {
      setSlotsLoading(false)
    }
  }

  useEffect(() => {
    if (step === 3 && selectedDate) fetchSlots(selectedDate)
  }, [step, selectedDate])

  async function handleSubmit() {
    if (!session || !businessId || !selectedService || !selectedEmployee || !selectedDate || !selectedSlot) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          employeeId: selectedEmployee.id,
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedSlot,
          notes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Randevunuz başarıyla oluşturuldu!')
        router.push('/customer/appointments')
      } else {
        toast.error(data.error || 'Bir hata oluştu')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function canNext() {
    if (step === 0) return !!selectedService
    if (step === 1) return !!selectedEmployee
    if (step === 2) return !!selectedDate
    if (step === 3) return !!selectedSlot
    return true
  }

  function next() {
    if (canNext()) setStep((s) => s + 1)
  }
  function prev() {
    if (step > 0) setStep((s) => s - 1)
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <Header />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
          <div style={{ fontSize: 14, color: 'var(--muted-color)' }}>Yükleniyor...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!business) return null

  // Build calendar days (next 30 days)
  const today = startOfDay(new Date())
  const days: Date[] = Array.from({ length: 30 }, (_, i) => addDays(today, i))

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>
        {/* Business name */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>{business.name}</h1>
          <p style={{ fontSize: 14, color: 'var(--muted-color)', marginTop: 4 }}>Randevu Oluştur</p>
        </div>

        {/* Step indicator */}
        <div className="bk-steps-indicator" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div className="bk-step-circle" style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < step ? 'var(--green)' : i === step ? 'var(--brand)' : 'var(--surface-2)',
                  color: i <= step ? 'white' : 'var(--muted-color)',
                  fontWeight: 700, fontSize: 14,
                  transition: 'all 0.2s',
                }}>
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span className="bk-step-label" style={{ fontSize: 11, fontWeight: 600, color: i === step ? 'var(--brand)' : 'var(--muted-color)' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="bk-step-connector" style={{ width: 48, height: 2, background: i < step ? 'var(--green)' : 'var(--line)', margin: '0 4px', marginTop: -16 }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 28, minHeight: 320 }}>
          {/* Step 0: Service */}
          {step === 0 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Hizmet Seçin</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {business.services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedService(s); setSelectedEmployee(null); setSelectedDate(''); setSelectedSlot('') }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '16px 18px', border: `2px solid ${selectedService?.id === s.id ? 'var(--brand)' : 'var(--line)'}`,
                      borderRadius: 14, background: selectedService?.id === s.id ? '#f1ede6' : 'white',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                      {s.description && <div style={{ fontSize: 13, color: 'var(--muted-color)', marginTop: 2 }}>{s.description}</div>}
                      <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {s.duration} dk
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 18, flexShrink: 0 }}>{formatPrice(s.price)}</div>
                  </button>
                ))}
                {business.services.length === 0 && (
                  <p style={{ color: 'var(--muted-color)', fontSize: 14 }}>Henüz hizmet eklenmemiş.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Employee */}
          {step === 1 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Çalışan Seçin</h2>
              {eligibleEmployees.length === 0 ? (
                <p style={{ color: 'var(--muted-color)', fontSize: 14 }}>Bu hizmet için uygun çalışan bulunamadı.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {eligibleEmployees.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => { setSelectedEmployee(e); setSelectedDate(''); setSelectedSlot('') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '16px 18px', border: `2px solid ${selectedEmployee?.id === e.id ? 'var(--brand)' : 'var(--line)'}`,
                        borderRadius: 14, background: selectedEmployee?.id === e.id ? '#f1ede6' : 'white',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--brand)', fontSize: 20, flexShrink: 0 }}>
                        {e.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{e.name} {e.surname}</div>
                        {e.title && <div style={{ fontSize: 13, color: 'var(--muted-color)' }}>{e.title}</div>}
                        {e.bio && <div style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 2 }}>{e.bio}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date - Month Calendar */}
          {step === 2 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Gün Seçin</h2>
              <MonthCalendar
                selectedDate={selectedDate}
                onSelect={(ds) => { setSelectedDate(ds); setSelectedSlot('') }}
                availableDays={days.map((d) => format(d, 'yyyy-MM-dd'))}
              />
            </div>
          )}

          {/* Step 3: Time */}
          {step === 3 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Saat Seçin</h2>
              <p style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 20 }}>
                {selectedDate && format(new Date(selectedDate + 'T12:00:00'), 'd MMMM yyyy EEEE', { locale: tr })}
              </p>
              {slotsLoading ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[1,2,3,4,5,6,8,9,10].map((i) => (
                    <div key={i} style={{ width: 80, height: 44, background: 'var(--surface-2)', borderRadius: 10 }} className="animate-pulse" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-color)' }}>
                  <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>Bu tarihte müsait saat bulunmuyor.</p>
                  <button onClick={() => setStep(2)} style={{ marginTop: 12, fontSize: 14, color: 'var(--brand)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Farklı tarih seçin
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '10px 18px', border: `2px solid ${selectedSlot === slot ? 'var(--brand)' : 'var(--line)'}`,
                        borderRadius: 10, background: selectedSlot === slot ? 'var(--brand)' : 'white',
                        color: selectedSlot === slot ? 'white' : 'var(--text)',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Randevuyu Onayla</h2>
              <div style={{ background: 'var(--surface-2)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <SummaryRow icon={<Scissors size={16} />} label="Hizmet" value={`${selectedService?.name} • ${selectedService?.duration} dk`} />
                  <SummaryRow icon={<User size={16} />} label="Çalışan" value={`${selectedEmployee?.name} ${selectedEmployee?.surname}`} />
                  <SummaryRow icon={<Calendar size={16} />} label="Tarih" value={selectedDate ? format(new Date(selectedDate + 'T12:00:00'), 'd MMMM yyyy EEEE', { locale: tr }) : ''} />
                  <SummaryRow icon={<Clock size={16} />} label="Saat" value={selectedSlot} />
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>Toplam</span>
                    <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--brand)' }}>{formatPrice(selectedService?.price ?? 0)}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Notlar (isteğe bağlı)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Özel istekleriniz varsa belirtebilirsiniz..."
                  rows={3}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: 14, fontSize: 13, color: '#15803d', marginBottom: 4 }}>
                Randevunuz oluşturulduktan sonra işletme tarafından onaylanacaktır. Bildirim alacaksınız.
              </div>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button
            onClick={prev}
            disabled={step === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px',
              border: '1px solid var(--line)', borderRadius: 12, background: 'white',
              fontWeight: 600, fontSize: 14, cursor: step === 0 ? 'not-allowed' : 'pointer',
              opacity: step === 0 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={18} /> Geri
          </button>

          {step < 4 ? (
            <button
              onClick={next}
              disabled={!canNext()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 28px',
                borderRadius: 12, background: canNext() ? 'var(--brand)' : 'var(--surface-2)',
                color: canNext() ? 'white' : 'var(--muted-color)',
                fontWeight: 700, fontSize: 14, border: 0, cursor: canNext() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              İleri <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 32px',
                borderRadius: 12, background: 'var(--green)',
                color: 'white', fontWeight: 700, fontSize: 14, border: 0,
                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Oluşturuluyor...' : 'Randevuyu Oluştur'} {!submitting && <Check size={18} />}
            </button>
          )}
        </div>
      </main>
      <Footer />
      <style>{`
        @media (max-width: 480px) {
          .bk-step-label { display: none !important; }
          .bk-step-circle { width: 28px !important; height: 28px !important; font-size: 11px !important; }
          .bk-step-connector { width: 20px !important; margin: 0 2px !important; }
          .bk-steps-indicator { margin-bottom: 24px !important; }
        }
      `}</style>
    </div>
  )
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: 'var(--muted-color)', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: 'var(--muted-color)', fontSize: 13, width: 70, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 14 }}>{value}</span>
    </div>
  )
}

function MonthCalendar({ selectedDate, onSelect, availableDays }: {
  selectedDate: string
  onSelect: (ds: string) => void
  availableDays: string[]
}) {
  const [viewMonth, setViewMonth] = useState(new Date())
  const today = startOfDay(new Date())
  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })

  const weeks: Date[][] = []
  let cur = calStart
  while (cur <= monthEnd || weeks.length < 6) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(cur)
      cur = addDays(cur, 1)
    }
    weeks.push(week)
    if (cur > monthEnd && weeks.length >= 4) break
  }

  const availableSet = new Set(availableDays)

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ‹
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{format(viewMonth, 'MMMM yyyy', { locale: tr })}</span>
        <button onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ›
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
        {['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--muted-color)', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
          {week.map((d) => {
            const ds = format(d, 'yyyy-MM-dd')
            const isSelected = ds === selectedDate
            const isAvailable = availableSet.has(ds)
            const isPast = isBefore(d, today)
            const isCurrentMonth = isSameMonth(d, viewMonth)
            const todayDay = isToday(d)
            return (
              <button
                key={ds}
                onClick={() => isAvailable && !isPast && onSelect(ds)}
                disabled={!isAvailable || isPast}
                style={{
                  height: 40, borderRadius: 10, border: `2px solid ${isSelected ? 'var(--brand)' : todayDay ? 'var(--gold)' : 'transparent'}`,
                  background: isSelected ? 'var(--brand)' : 'white',
                  color: isSelected ? 'white' : !isCurrentMonth || isPast || !isAvailable ? 'var(--muted-color)' : 'var(--text)',
                  fontWeight: isSelected || todayDay ? 800 : 500,
                  fontSize: 14, cursor: isAvailable && !isPast ? 'pointer' : 'default',
                  opacity: !isCurrentMonth ? 0.3 : 1,
                }}
              >
                {format(d, 'd')}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <BookingContent />
    </Suspense>
  )
}
