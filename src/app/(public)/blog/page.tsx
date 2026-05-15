import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ArrowRight, Calendar, Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog | Bakımla',
  description: 'Kişisel bakım, güzellik ve sağlıklı yaşam hakkında ipuçları, trendler ve uzman tavsiyeleri.',
  openGraph: {
    title: 'Blog | Bakımla',
    description: 'Kişisel bakım ipuçları ve güzellik trendleri',
    type: 'website',
  },
}

async function getPosts(tag?: string) {
  return prisma.blogPost.findMany({
    where: {
      isPublished: true,
      ...(tag ? { tags: { contains: tag } } : {}),
    },
    orderBy: { publishedAt: 'desc' },
    take: 12,
    select: {
      id: true, title: true, slug: true, excerpt: true,
      coverImage: true, publishedAt: true, tags: true,
      author: { select: { name: true, surname: true } },
    },
  })
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams
  let posts: Awaited<ReturnType<typeof getPosts>> = []
  try { posts = await getPosts(tag) } catch { /* empty */ }

  const allTags = Array.from(new Set(
    posts.flatMap((p) => (p.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean))
  ))

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 24px 60px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', margin: '0 0 10px', letterSpacing: '-0.5px' }}>Blog & İpuçları</h1>
          <p style={{ fontSize: 15, color: 'var(--muted-color)', maxWidth: 520, margin: '0 auto' }}>
            Kişisel bakım, güzellik ve sağlıklı yaşam hakkında uzman içerikler.
          </p>
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
            <Link
              href="/blog"
              style={{
                padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                textDecoration: 'none',
                background: !tag ? 'var(--brand)' : 'white',
                color: !tag ? 'white' : 'var(--text)',
                border: '1px solid var(--line)',
              }}
            >
              Tümü
            </Link>
            {allTags.map((t) => (
              <Link
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}`}
                style={{
                  padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                  textDecoration: 'none',
                  background: tag === t ? 'var(--brand)' : 'white',
                  color: tag === t ? 'white' : 'var(--text)',
                  border: '1px solid var(--line)',
                }}
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--muted-color)', fontSize: 15 }}>
            Henüz blog yazısı yok. Yakında içerik eklenecek.
          </div>
        ) : (
          <>
            {/* Featured first post */}
            {posts[0] && (
              <Link href={`/blog/${posts[0].slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 28 }}>
                <div className="bk-card bk-blog-featured" style={{
                  background: 'white', border: '1px solid var(--line)', borderRadius: 20,
                  overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr',
                }}>
                  {posts[0].coverImage ? (
                    <div style={{ minHeight: 300, background: `url(${posts[0].coverImage}) center/cover` }} />
                  ) : (
                    <div style={{ minHeight: 300, background: 'linear-gradient(135deg, var(--brand) 0%, var(--gold) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 48 }}>✦</div>
                  )}
                  <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {posts[0].tags && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                        <Tag size={11} /> {posts[0].tags.split(',')[0].trim()}
                      </span>
                    )}
                    <h2 style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.3, margin: '0 0 12px', color: 'var(--text)' }}>{posts[0].title}</h2>
                    {posts[0].excerpt && <p style={{ fontSize: 14, color: 'var(--muted-color)', lineHeight: 1.65, margin: '0 0 20px' }}>{posts[0].excerpt}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--muted-color)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Calendar size={12} />
                        {posts[0].publishedAt ? new Date(posts[0].publishedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Devamını Oku <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Rest of posts grid */}
            {posts.length > 1 && (
              <div className="bk-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                {posts.slice(1).map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <article className="bk-card" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 18, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {post.coverImage ? (
                        <div style={{ height: 180, background: `url(${post.coverImage}) center/cover` }} />
                      ) : (
                        <div style={{ height: 180, background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--line) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'var(--muted-color)' }}>✦</div>
                      )}
                      <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {post.tags && (
                          <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                            {post.tags.split(',')[0].trim()}
                          </span>
                        )}
                        <h3 style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.4, margin: '0 0 8px', color: 'var(--text)', flex: 1 }}>{post.title}</h3>
                        {post.excerpt && (
                          <p style={{ fontSize: 13, color: 'var(--muted-color)', lineHeight: 1.55, margin: '0 0 14px' }}>
                            {post.excerpt.slice(0, 90)}{post.excerpt.length > 90 ? '…' : ''}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                          <span style={{ fontSize: 11.5, color: 'var(--muted-color)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={11} />
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : ''}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            Oku <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
