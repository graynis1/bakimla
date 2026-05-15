'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2 } from 'lucide-react'

interface BankAccount {
  id: string
  bankName: string
  accountName: string
  iban: string
  branch?: string | null
  isActive: boolean
}

interface Form {
  bankName: string
  accountName: string
  iban: string
  branch: string
}

const EMPTY: Form = { bankName: '', accountName: '', iban: '', branch: '' }

export default function AdminBankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<BankAccount | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAccounts() }, [])

  async function fetchAccounts() {
    const res = await fetch('/api/admin/bank-accounts')
    const data = await res.json()
    if (data.success) setAccounts(data.data)
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(a: BankAccount) {
    setEditing(a)
    setForm({ bankName: a.bankName, accountName: a.accountName, iban: a.iban, branch: a.branch || '' })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const url = editing ? `/api/admin/bank-accounts/${editing.id}` : '/api/admin/bank-accounts'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, branch: form.branch || null }),
      })
      const data = await res.json()
      if (data.success) { toast.success(editing ? 'Hesap güncellendi' : 'Hesap eklendi'); setShowModal(false); fetchAccounts() }
      else toast.error(data.error)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(a: BankAccount) {
    const res = await fetch(`/api/admin/bank-accounts/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !a.isActive }),
    })
    const data = await res.json()
    if (data.success) { toast.success('Hesap güncellendi'); fetchAccounts() }
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>Banka Hesapları</h1>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px', border: 0, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          <Plus size={16} /> Hesap Ekle
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2].map((i) => <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16, height: 100 }} className="animate-pulse" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-color)', fontSize: 14 }}>Henüz banka hesabı eklenmemiş.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {accounts.map((a) => (
            <div key={a.id} style={{ background: 'white', border: `1px solid ${a.isActive ? 'var(--line)' : '#fecaca'}`, borderRadius: 18, padding: 20, opacity: a.isActive ? 1 : 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{a.bankName}</span>
                    {!a.isActive && <span style={{ fontSize: 11, color: '#b42318', background: '#fee2e2', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>Pasif</span>}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--muted-color)' }}>Hesap Adı: <strong>{a.accountName}</strong></div>
                  <div style={{ fontSize: 14, fontFamily: 'monospace', marginTop: 4 }}>{a.iban}</div>
                  {a.branch && <div style={{ fontSize: 13, color: 'var(--muted-color)', marginTop: 2 }}>Şube: {a.branch}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(a)} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => toggleActive(a)} style={{ padding: '0 14px', height: 36, borderRadius: 10, border: `1px solid ${a.isActive ? '#fecaca' : '#86efac'}`, background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: a.isActive ? '#b42318' : '#15803d' }}>
                    {a.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 480, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: 20, fontSize: 18 }}>{editing ? 'Hesabı Düzenle' : 'Yeni Banka Hesabı'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Banka Adı</label>
                <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} style={inputStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Hesap Adı</label>
                <input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} style={inputStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>IBAN</label>
                <input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} style={inputStyle} placeholder="TR..." required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Şube (isteğe bağlı)</label>
                <input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, height: 44, border: '1px solid var(--line)', borderRadius: 12, background: 'white', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, height: 44, border: 0, borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
