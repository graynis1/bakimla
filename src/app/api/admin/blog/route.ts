import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: { id: true, title: true, slug: true, isPublished: true, publishedAt: true, tags: true, createdAt: true },
    }),
    prisma.blogPost.count(),
  ])
  return NextResponse.json({ posts, total })
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, excerpt, content, coverImage, isPublished, metaTitle, metaDesc, tags } = body

  if (!title || !content) return NextResponse.json({ error: 'Başlık ve içerik zorunludur' }, { status: 400 })

  const baseSlug = slugify(title)
  let slug = baseSlug
  let counter = 1
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`
  }

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      coverImage: coverImage || null,
      isPublished: !!isPublished,
      publishedAt: isPublished ? new Date() : null,
      metaTitle: metaTitle || null,
      metaDesc: metaDesc || null,
      tags: tags || null,
    },
  })
  return NextResponse.json(post, { status: 201 })
}
