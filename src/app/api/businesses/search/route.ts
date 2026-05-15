import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const query = searchParams.get('query') || ''
    const city = searchParams.get('city') || ''
    const district = searchParams.get('district') || ''
    const category = searchParams.get('category') || ''
    const minRating = searchParams.get('minRating') || ''
    const sortBy = searchParams.get('sortBy') || 'rating'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = 12
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { status: 'APPROVED' }

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { services: { some: { name: { contains: query, mode: 'insensitive' }, isActive: true } } },
      ]
    }
    if (city) where.city = city
    if (district) where.district = district
    if (category) where.category = category
    if (minRating) {
      const parsedRating = parseFloat(minRating)
      if (!isNaN(parsedRating)) where.rating = { gte: parsedRating }
    }

    const orderBy: Record<string, string> =
      sortBy === 'reviewCount' ? { reviewCount: 'desc' }
      : sortBy === 'newest' ? { createdAt: 'desc' }
      : { rating: 'desc' }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        select: { id: true, name: true, slug: true, category: true, city: true, district: true, rating: true, reviewCount: true, coverImage: true },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.business.count({ where }),
    ])

    return NextResponse.json({ success: true, data: { businesses, total, page } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Arama hatası' }, { status: 500 })
  }
}
