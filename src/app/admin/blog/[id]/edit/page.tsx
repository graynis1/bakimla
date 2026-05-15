'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import ImageUpload from '@/components/ui/ImageUpload'

export default function EditBlogPostPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    tags: '',
    metaTitle: '',
    metaDesc: '',
    isPublished: false,
  })

  useEffect(() => {
    fetch(`/api/admin/blog/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.title) { toast.error('Yazı bulunamadı'); router.push('/admin/blog'); return }
        setForm({
          title: data.title ?? '',
          excerpt: data.excerpt ?? '',
          content: data.content ?? '',
          coverImage: data.coverImage ?? '',
          tags: data.tags ?? '',
          metaTitle: data.metaTitle ?? '',
          metaDesc: data.metaDesc ?? '',
          isPublished: data.isPublished ?? false,
        })
        setLoading(false)
      })
      .catch(() => { toast.error('Yazı yüklenemedi'); router.push('/admin/blog') })
  }, [id])

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(publish: boolean) {
    if (!form.title.trim()) { toast.error('Başlık zorunludur'); return }
    if (!form.content.trim()) { toast.error('İçerik zorunludur'); return }
    setSaving(true)
    const res = await fetch(`/api/admin/blog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, isPublished: publish }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success(publish ? 'Yazı yayınlandı' : 'Taslak kaydedildi')
      router.push('/admin/blog')
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Kaydedilemedi')
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-color)' }}>Yükleniyor...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/admin/blog" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-color)', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Geri
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', margin: 0 }}>Yazıyı Düzenle</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }} className="bk-blog-editor">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Başlık *</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Yazı başlığı..." style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }} />
          </div>

          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Özet</label>
            <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} placeholder="Yazının kısa özeti..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>İçerik *</label>
            <textarea value={form.content} onChange={(e) => set('content', e.target.value)} rows={18} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
            <p style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 8 }}>HTML tagları desteklenir</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>Yayın</h2>
            <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 10, background: form.isPublished ? '#dcfce7' : '#fef9c3', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
              {form.isPublished ? <Eye size={14} color="#16a34a" /> : <EyeOff size={14} color="#ca8a04" />}
              <span style={{ color: form.isPublished ? '#16a34a' : '#ca8a04' }}>{form.isPublished ? 'Yayında' : 'Taslak'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => handleSave(false)} disabled={saving} style={{ width: '100%', height: 42, borderRadius: 12, border: '1.5px solid var(--line)', background: 'white', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Save size={15} /> Taslak Kaydet
              </button>
              <button onClick={() => handleSave(true)} disabled={saving} style={{ width: '100%', height: 42, borderRadius: 12, border: 0, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Eye size={15} /> Yayınla
              </button>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Kapak Görseli</h2>
            <ImageUpload
              value={form.coverImage}
              onChange={(url) => set('coverImage', url)}
              height={140}
            />
          </div>

          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Etiketler</h2>
            <input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="Güzellik, Saç, İpuçları" style={inputStyle} />
            <p style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 6 }}>Virgülle ayırın</p>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>SEO</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--muted-color)' }}>Meta Başlık</label>
                <input value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} placeholder="SEO başlığı" style={inputStyle} />
                <div style={{ fontSize: 11, color: form.metaTitle.length > 60 ? 'var(--danger)' : 'var(--muted-color)', marginTop: 4 }}>{form.metaTitle.length}/60</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--muted-color)' }}>Meta Açıklama</label>
                <textarea value={form.metaDesc} onChange={(e) => set('metaDesc', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                <div style={{ fontSize: 11, color: form.metaDesc.length > 160 ? 'var(--danger)' : 'var(--muted-color)', marginTop: 4 }}>{form.metaDesc.length}/160</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
