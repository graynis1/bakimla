import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({
    where: { slug, isPublished: true },
    select: { title: true, metaTitle: true, metaDesc: true, excerpt: true, coverImage: true },
  })
  if (!post) return { title: 'Yazı Bulunamadı | Bakımla' }

  const title = post.metaTitle || `${post.title} | Bakımla`
  const description = post.metaDesc || post.excerpt || 'Bakımla Blog - Kişisel bakım ve güzellik ipuçları'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      ...(post.coverImage ? { images: [{ url: post.coverImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  let post
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug, isPublished: true },
      include: { author: { select: { name: true, surname: true } } },
    })
  } catch { notFound() }

  if (!post) notFound()

  const relatedPosts = await prisma.blogPost.findMany({
    where: { isPublished: true, id: { not: post.id } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: { id: true, title: true, slug: true, coverImage: true, publishedAt: true },
  }).catch(() => [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.metaDesc,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.author ? { '@type': 'Person', name: `${post.author.name} ${post.author.surname}` } : undefined,
    image: post.coverImage,
    publisher: { '@type': 'Organization', name: 'Bakımla' },
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />

      {/* JSON-LD structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '36px 24px 60px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, fontSize: 13, color: 'var(--muted-color)' }}>
          <Link href="/" style={{ color: 'var(--muted-color)', textDecoration: 'none' }}>Ana Sayfa</Link>
          <span>/</span>
          <Link href="/blog" style={{ color: 'var(--muted-color)', textDecoration: 'none' }}>Blog</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{post.title.slice(0, 40)}{post.title.length > 40 ? '…' : ''}</span>
        </div>

        <article>
          {/* Tags */}
          {post.tags && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {post.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`}
                  style={{ padding: '4px 12px', borderRadius: 99, background: 'var(--gold-soft)', color: 'var(--gold)', fontSize: 11.5, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={10} /> {t}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.2, color: 'var(--text)', letterSpacing: '-0.5px', margin: '0 0 16px' }}>
            {post.title}
          </h1>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 28, fontSize: 13, color: 'var(--muted-color)' }}>
            {post.author && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <User size={13} /> {post.author.name} {post.author.surname}
              </span>
            )}
            {post.publishedAt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={13} />
                {new Date(post.publishedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>

          {/* Cover image */}
          {post.coverImage && (
            <div style={{ marginBottom: 36, borderRadius: 20, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: 420, objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--muted-color)', fontWeight: 500, margin: '0 0 28px', borderLeft: '3px solid var(--gold)', paddingLeft: 20 }}>
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text)' }}
            className="bk-blog-content"
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
          />
        </article>

        {/* Back link */}
        <div style={{ margin: '48px 0 32px' }}>
          <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Tüm Yazılara Dön
          </Link>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>İlgili Yazılar</h2>
            <div className="bk-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="bk-card" style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
                    {rp.coverImage ? (
                      <div style={{ height: 120, background: `url(${rp.coverImage}) center/cover` }} />
                    ) : (
                      <div style={{ height: 120, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--muted-color)' }}>✦</div>
                    )}
                    <div style={{ padding: '12px 14px' }}>
                      <h3 style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.4, margin: 0, color: 'var(--text)' }}>{rp.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
