'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cityList, getDistricts } from '@/lib/locations'
import { categoryLabels } from '@/lib/utils'

const CATEGORIES = Object.entries(categoryLabels)

export default function RegisterPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'customer' | 'business'>('customer')
  const [loading, setLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')
  const [form, setForm] = useState({
    name: '', surname: '', email: '', phone: '', password: '', passwordConfirm: '',
    businessName: '', category: '', city: '', district: '', businessPhone: '',
  })

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'city') {
      setSelectedCity(value)
      setForm((prev) => ({ ...prev, city: value, district: '' }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.passwordConfirm) {
      toast.error('Şifreler eşleşmiyor')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: tab === 'business' ? 'SALON_OWNER' : 'CUSTOMER' }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error || 'Kayıt başarısız')
      } else {
        toast.success('Kayıt başarılı! Giriş yapabilirsiniz.')
        router.push('/auth/login')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center py-10 px-5" style={{ flex: 1 }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--brand)' }}>Kayıt Ol</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-color)' }}>Yeni hesap oluşturun</p>
        </div>

        <div className="bg-white rounded-[18px] border p-8" style={{ borderColor: 'var(--line)', boxShadow: 'var(--bk-shadow)' }}>
          <div className="flex gap-2 mb-6 bg-[#f1ede6] rounded-xl p-1">
            {(['customer', 'business'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all"
                style={{
                  background: tab === t ? 'white' : 'transparent',
                  color: tab === t ? 'var(--brand)' : 'var(--muted-color)',
                }}
              >
                {t === 'customer' ? 'Müşteri' : 'İşletme'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ad</Label>
                <Input className="mt-1" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
              </div>
              <div>
                <Label>Soyad</Label>
                <Input className="mt-1" value={form.surname} onChange={(e) => handleChange('surname', e.target.value)} required />
              </div>
            </div>
            <div>
              <Label>E-posta</Label>
              <Input className="mt-1" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input className="mt-1" type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>

            {tab === 'business' && (
              <>
                <div>
                  <Label>İşletme Adı</Label>
                  <Input className="mt-1" value={form.businessName} onChange={(e) => handleChange('businessName', e.target.value)} required />
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select onValueChange={(v: string | null) => { if (v) handleChange('category', v) }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Kategori seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Şehir</Label>
                    <Select onValueChange={(v: string | null) => { if (v) handleChange('city', v) }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Şehir" />
                      </SelectTrigger>
                      <SelectContent>
                        {cityList.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>İlçe</Label>
                    <Select onValueChange={(v: string | null) => { if (v) handleChange('district', v) }} disabled={!selectedCity}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="İlçe" />
                      </SelectTrigger>
                      <SelectContent>
                        {getDistricts(selectedCity).map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>İşletme Telefonu</Label>
                  <Input className="mt-1" type="tel" value={form.businessPhone} onChange={(e) => handleChange('businessPhone', e.target.value)} required />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Şifre</Label>
                <Input className="mt-1" type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} required />
              </div>
              <div>
                <Label>Şifre Tekrar</Label>
                <Input className="mt-1" type="password" value={form.passwordConfirm} onChange={(e) => handleChange('passwordConfirm', e.target.value)} required />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold rounded-xl mt-2"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-color)' }}>
            Zaten hesabınız var mı?{' '}
            <Link href="/auth/login" className="font-semibold" style={{ color: 'var(--gold)' }}>
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
