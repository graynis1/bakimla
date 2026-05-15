import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor' }, { status: 401 })

  const businessId = req.nextUrl.searchParams.get('businessId')
  if (businessId) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_businessId: { userId: session.user.id, businessId } },
    })
    return NextResponse.json({ success: true, data: { isFavorited: !!fav } })
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { business: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ success: true, data: favorites })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor' }, { status: 401 })

  const { businessId } = await req.json()
  const existing = await prisma.favorite.findUnique({
    where: { userId_businessId: { userId: session.user.id, businessId } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ success: true, data: { isFavorited: false } })
  } else {
    await prisma.favorite.create({ data: { userId: session.user.id, businessId } })
    return NextResponse.json({ success: true, data: { isFavorited: true } })
  }
}
