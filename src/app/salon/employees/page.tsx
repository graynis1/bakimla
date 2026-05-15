'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, Clock, Scissors, Check } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface ScheduleDay {
  dayOfWeek: number
  isWorking: boolean
  startTime: string
  endTime: string
}

interface ServiceInfo {
  id: string
  name: string
  duration: number
  price: number
}

interface Employee {
  id: string
  name: string
  surname: string
  title?: string | null
  bio?: string | null
  phone?: string | null
  isActive: boolean
  sortOrder: number
  schedule: ScheduleDay[]
  services: { serviceId: string; service: ServiceInfo }[]
}

interface EmployeeForm {
  name: string
  surname: string
  title: string
  bio: string
  phone: string
}

const EMPTY_FORM: EmployeeForm = { name: '', surname: '', title: '', bio: '', phone: '' }
const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const DAYS_FULL = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

const DEFAULT_SCHEDULE: ScheduleDay[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  isWorking: i < 6,
  startTime: '09:00',
  endTime: i === 5 ? '17:00' : '19:00',
}))

const TIME_OPTIONS = Array.from({ length: 29 }, (_, i) => {
  const h = Math.floor(i / 2) + 7
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

export default function SalonEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [limit, setLimit] = useState<number | null>(null)

  // Schedule modal
  const [scheduleEmp, setScheduleEmp] = useState<Employee | null>(null)
  const [schedule, setSchedule] = useState<ScheduleDay[]>(DEFAULT_SCHEDULE)
  const [savingSchedule, setSavingSchedule] = useState(false)

  // Services modal
  const [servicesEmp, setServicesEmp] = useState<Employee | null>(null)
  const [allServices, setAllServices] = useState<ServiceInfo[]>([])
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [savingServices, setSavingServices] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [empRes, limitRes] = await Promise.all([
        fetch('/api/salon/employees'),
        fetch('/api/salon/subscription-limit'),
      ])
      const empData = await empRes.json()
      const limitData = await limitRes.json()
      if (empData.success) setEmployees(empData.data)
      if (limitData.success) setLimit(limitData.data.limit)
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(emp: Employee) {
    setEditing(emp)
    setForm({ name: emp.name, surname: emp.surname, title: emp.title || '', bio: emp.bio || '', phone: emp.phone || '' })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/salon/employees/${editing.id}` : '/api/salon/employees'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editing ? 'Çalışan güncellendi' : 'Çalışan eklendi')
        setShowModal(false)
        fetchData()
      } else toast.error(data.error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu çalışanı silmek istediğinizden emin misiniz?')) return
    try {
      const res = await fetch(`/api/salon/employees/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { toast.success('Çalışan silindi'); fetchData() }
      else toast.error(data.error)
    } catch { toast.error('Bir hata oluştu') }
  }

  async function openSchedule(emp: Employee) {
    setScheduleEmp(emp)
    const res = await fetch(`/api/salon/employees/${emp.id}/schedule`)
    const data = await res.json()
    if (data.success && data.data.length > 0) {
      const sorted = [...data.data].sort((a: ScheduleDay, b: ScheduleDay) => a.dayOfWeek - b.dayOfWeek)
      setSchedule(sorted)
    } else {
      setSchedule(DEFAULT_SCHEDULE)
    }
  }

  async function saveSchedule() {
    if (!scheduleEmp) return
    setSavingSchedule(true)
    try {
      const res = await fetch(`/api/salon/employees/${scheduleEmp.id}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Çizelge kaydedildi')
        setScheduleEmp(null)
        fetchData()
      } else toast.error(data.error)
    } finally {
      setSavingSchedule(false)
    }
  }

  async function openServices(emp: Employee) {
    setServicesEmp(emp)
    const res = await fetch(`/api/salon/employees/${emp.id}/services`)
    const data = await res.json()
    if (data.success) {
      setAllServices(data.data.services)
      setAssignedIds(data.data.assigned)
    }
  }

  async function saveServices() {
    if (!servicesEmp) return
    setSavingServices(true)
    try {
      const res = await fetch(`/api/salon/employees/${servicesEmp.id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignedIds),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Hizmetler güncellendi')
        setServicesEmp(null)
        fetchData()
      } else toast.error(data.error)
    } finally {
      setSavingServices(false)
    }
  }

  function toggleService(id: string) {
    setAssignedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function updateScheduleDay(dayOfWeek: number, field: keyof ScheduleDay, value: boolean | string) {
    setSchedule((prev) => prev.map((d) => d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
  }

  const canAdd = limit === null || employees.filter((e) => e.isActive).length < limit
  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Çalışanlar</h1>
          {limit !== null && (
            <p style={{ fontSize: 13, color: 'var(--muted-color)', marginTop: 4 }}>
              {employees.filter((e) => e.isActive).length} / {limit} çalışan
            </p>
          )}
        </div>
        <button
          onClick={openAdd}
          disabled={!canAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', border: 0, borderRadius: 12, background: canAdd ? 'var(--brand)' : 'var(--surface-2)', color: canAdd ? 'white' : 'var(--muted-color)', fontWeight: 700, fontSize: 14, cursor: canAdd ? 'pointer' : 'not-allowed' }}
        >
          <Plus size={16} /> Çalışan Ekle
        </button>
      </div>

      {!canAdd && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 14, padding: 14, fontSize: 14, color: '#92400e', marginBottom: 20 }}>
          Planınızdaki çalışan limitine ulaştınız. Daha fazla çalışan eklemek için aboneliğinizi yükseltin.
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16, height: 100 }} className="animate-pulse" />)}
        </div>
      ) : employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-color)' }}>
          <p style={{ fontSize: 14 }}>Henüz çalışan eklenmemiş.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {employees.map((emp) => {
            const workDays = emp.schedule.filter((d) => d.isWorking)
            const assignedServices = emp.services.map((s) => s.service)
            return (
              <div key={emp.id} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--brand)', fontSize: 20, flexShrink: 0 }}>
                      {emp.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.name} {emp.surname}</div>
                      {emp.title && <div style={{ fontSize: 13, color: 'var(--muted-color)' }}>{emp.title}</div>}
                      {!emp.isActive && <span style={{ fontSize: 11, color: '#b42318', fontWeight: 700 }}>Pasif</span>}
                    </div>
                  </div>
                  <div className="bk-emp-actions" style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openSchedule(emp)}
                      title="Çalışma Saatleri"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}
                    >
                      <Clock size={13} /><span className="bk-emp-action-label"> Saatler</span>
                    </button>
                    <button
                      onClick={() => openServices(emp)}
                      title="Hizmetler"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}
                    >
                      <Scissors size={13} /><span className="bk-emp-action-label"> Hizmetler</span>
                    </button>
                    <button onClick={() => openEdit(emp)} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(emp.id)} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fecaca', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b42318' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Summary row */}
                <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {workDays.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <Clock size={12} style={{ color: 'var(--muted-color)' }} />
                      <span style={{ fontSize: 12, color: 'var(--muted-color)' }}>
                        {workDays.map((d) => DAYS_TR[d.dayOfWeek]).join(', ')}
                      </span>
                    </div>
                  )}
                  {assignedServices.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <Scissors size={12} style={{ color: 'var(--muted-color)' }} />
                      <span style={{ fontSize: 12, color: 'var(--muted-color)' }}>
                        {assignedServices.map((s) => s.name).join(', ')}
                      </span>
                    </div>
                  )}
                  {assignedServices.length === 0 && (
                    <span style={{ fontSize: 12, color: '#ef4444' }}>Henüz hizmet atanmamış</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Employee info modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 480, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: 20, fontSize: 18 }}>{editing ? 'Çalışanı Düzenle' : 'Yeni Çalışan'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="bk-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Ad</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Soyad</label>
                  <input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} style={inputStyle} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Unvan</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="Kuaför, Manikür Uzmanı..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Telefon</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="05XX..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Hakkında</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, height: 44, border: '1px solid var(--line)', borderRadius: 12, background: 'white', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.surname} style={{ flex: 1, height: 44, border: 0, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule modal */}
      {scheduleEmp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setScheduleEmp(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 540, width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: 6, fontSize: 18 }}>Çalışma Saatleri</h3>
            <p style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 20 }}>{scheduleEmp.name} {scheduleEmp.surname}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {schedule.map((day) => (
                <div key={day.dayOfWeek} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: `1px solid ${day.isWorking ? 'var(--line)' : '#f3f4f6'}`, borderRadius: 12, background: day.isWorking ? 'white' : '#fafafa' }}>
                  <button
                    onClick={() => updateScheduleDay(day.dayOfWeek, 'isWorking', !day.isWorking)}
                    style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${day.isWorking ? 'var(--brand)' : 'var(--line)'}`, background: day.isWorking ? 'var(--brand)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    {day.isWorking && <Check size={12} color="white" />}
                  </button>
                  <span style={{ width: 80, fontWeight: 600, fontSize: 14, color: day.isWorking ? 'var(--text)' : 'var(--muted-color)' }}>
                    {DAYS_FULL[day.dayOfWeek]}
                  </span>
                  {day.isWorking ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <select
                        value={day.startTime}
                        onChange={(e) => updateScheduleDay(day.dayOfWeek, 'startTime', e.target.value)}
                        style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                      >
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span style={{ fontSize: 13, color: 'var(--muted-color)' }}>—</span>
                      <select
                        value={day.endTime}
                        onChange={(e) => updateScheduleDay(day.dayOfWeek, 'endTime', e.target.value)}
                        style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                      >
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--muted-color)', flex: 1 }}>Kapalı</span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setScheduleEmp(null)} style={{ flex: 1, height: 44, border: '1px solid var(--line)', borderRadius: 12, background: 'white', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button onClick={saveSchedule} disabled={savingSchedule} style={{ flex: 1, height: 44, border: 0, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, cursor: savingSchedule ? 'not-allowed' : 'pointer' }}>
                {savingSchedule ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services assignment modal */}
      {servicesEmp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setServicesEmp(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 480, width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: 6, fontSize: 18 }}>Hizmet Ataması</h3>
            <p style={{ fontSize: 13, color: 'var(--muted-color)', marginBottom: 20 }}>{servicesEmp.name} {servicesEmp.surname} — bu çalışanın sunduğu hizmetleri seçin</p>

            {allServices.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted-color)', fontSize: 14 }}>
                Önce Hizmetler bölümünden hizmet ekleyin.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allServices.map((s) => {
                  const isAssigned = assignedIds.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', border: `2px solid ${isAssigned ? 'var(--brand)' : 'var(--line)'}`,
                        borderRadius: 12, background: isAssigned ? '#f1ede6' : 'white',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isAssigned ? 'var(--brand)' : 'var(--line)'}`, background: isAssigned ? 'var(--brand)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isAssigned && <Check size={12} color="white" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>⏱ {s.duration} dk</div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 15 }}>{formatPrice(s.price)}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setServicesEmp(null)} style={{ flex: 1, height: 44, border: '1px solid var(--line)', borderRadius: 12, background: 'white', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button onClick={saveServices} disabled={savingServices || allServices.length === 0} style={{ flex: 1, height: 44, border: 0, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, cursor: savingServices ? 'not-allowed' : 'pointer' }}>
                {savingServices ? 'Kaydediliyor...' : `Kaydet (${assignedIds.length} hizmet)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
