import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(20, parseInt(searchParams.get('limit') ?? '9'))
  const tag = searchParams.get('tag')
  const skip = (page - 1) * limit

  const where = {
    isPublished: true,
    ...(tag ? { tags: { contains: tag } } : {}),
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        coverImage: true, publishedAt: true, tags: true,
        metaTitle: true, metaDesc: true,
        author: { select: { name: true, surname: true } },
      },
    }),
    prisma.blogPost.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, limit, totalPages: Math.ceil(total / limit) })
}
