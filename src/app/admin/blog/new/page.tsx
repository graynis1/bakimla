'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import { toast } from 'sonner'
import ImageUpload from '@/components/ui/ImageUpload'

export default function NewBlogPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
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

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(publish: boolean) {
    if (!form.title.trim()) { toast.error('Başlık zorunludur'); return }
    if (!form.content.trim()) { toast.error('İçerik zorunludur'); return }
    setSaving(true)
    const res = await fetch('/api/admin/blog', {
      method: 'POST',
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/admin/blog" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-color)', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Geri
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', margin: 0 }}>Yeni Blog Yazısı</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }} className="bk-blog-editor">
        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Başlık *</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Yazı başlığı..." style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }} />
          </div>

          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Özet</label>
            <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} placeholder="Yazının kısa özeti (liste sayfasında görünür)..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>İçerik *</label>
            <textarea value={form.content} onChange={(e) => set('content', e.target.value)} placeholder="Yazı içeriğini buraya yazın. HTML veya düz metin kullanabilirsiniz..." rows={18} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
            <p style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 8 }}>HTML tagları desteklenir: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, &lt;img&gt; vb.</p>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Actions */}
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>Yayın</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => handleSave(false)} disabled={saving} style={{ width: '100%', height: 42, borderRadius: 12, border: '1.5px solid var(--line)', background: 'white', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Save size={15} /> Taslak Kaydet
              </button>
              <button onClick={() => handleSave(true)} disabled={saving} style={{ width: '100%', height: 42, borderRadius: 12, border: 0, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Eye size={15} /> Yayınla
              </button>
            </div>
          </div>

          {/* Cover image */}
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Kapak Görseli</h2>
            <ImageUpload
              value={form.coverImage}
              onChange={(url) => set('coverImage', url)}
              height={140}
            />
          </div>

          {/* Tags */}
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Etiketler</h2>
            <input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="Güzellik, Saç, İpuçları" style={inputStyle} />
            <p style={{ fontSize: 12, color: 'var(--muted-color)', marginTop: 6 }}>Virgülle ayırın</p>
          </div>

          {/* SEO */}
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>SEO</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--muted-color)' }}>Meta Başlık</label>
                <input value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} placeholder="SEO başlığı (boş bırakılırsa başlık kullanılır)" style={inputStyle} />
                <div style={{ fontSize: 11, color: form.metaTitle.length > 60 ? 'var(--danger)' : 'var(--muted-color)', marginTop: 4 }}>{form.metaTitle.length}/60 karakter</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--muted-color)' }}>Meta Açıklama</label>
                <textarea value={form.metaDesc} onChange={(e) => set('metaDesc', e.target.value)} placeholder="Arama sonuçlarında görünecek açıklama" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                <div style={{ fontSize: 11, color: form.metaDesc.length > 160 ? 'var(--danger)' : 'var(--muted-color)', marginTop: 4 }}>{form.metaDesc.length}/160 karakter</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
