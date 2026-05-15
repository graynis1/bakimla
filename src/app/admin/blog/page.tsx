'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface BlogPost {
  id: string
  title: string
  slug: string
  isPublished: boolean
  publishedAt: string | null
  tags: string | null
  createdAt: string
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/blog')
    if (res.ok) {
      const data = await res.json()
      setPosts(data.posts)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" yazısını silmek istediğinize emin misiniz?`)) return
    const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Yazı silindi'); load() }
    else toast.error('Silinemedi')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', margin: 0 }}>Blog Yazıları</h1>
        <Link href="/admin/blog/new" style={{ height: 42, padding: '0 20px', borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Yeni Yazı
        </Link>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-color)' }}>Yükleniyor...</div>
        ) : posts.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <p style={{ color: 'var(--muted-color)', fontSize: 15, marginBottom: 16 }}>Henüz blog yazısı yok.</p>
            <Link href="/admin/blog/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              <Plus size={16} /> İlk Yazıyı Ekle
            </Link>
          </div>
        ) : (
          <div className="bk-table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}>
                  {['Başlık', 'Etiketler', 'Durum', 'Tarih', 'İşlemler'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--muted-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{post.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted-color)' }}>/{post.slug}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {post.tags ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {post.tags.split(',').slice(0, 2).map((t) => (
                            <span key={t} style={{ padding: '2px 8px', borderRadius: 99, background: 'var(--gold-soft)', color: 'var(--gold)', fontSize: 11, fontWeight: 600 }}>{t.trim()}</span>
                          ))}
                        </div>
                      ) : <span style={{ color: 'var(--muted-color)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: post.isPublished ? '#dcfce7' : '#fef9c3', color: post.isPublished ? '#16a34a' : '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {post.isPublished ? <Eye size={11} /> : <EyeOff size={11} />}
                        {post.isPublished ? 'Yayında' : 'Taslak'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--muted-color)' }}>
                      {new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {post.isPublished && (
                          <Link href={`/blog/${post.slug}`} target="_blank" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--muted-color)' }}>
                            <Eye size={14} />
                          </Link>
                        )}
                        <Link href={`/admin/blog/${post.id}/edit`} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--text)' }}>
                          <Edit2 size={14} />
                        </Link>
                        <button onClick={() => handleDelete(post.id, post.title)} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #fecaca', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
