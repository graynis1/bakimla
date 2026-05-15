import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function getBusiness(userId: string) {
  return prisma.business.findFirst({ where: { ownerId: userId } })
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await getBusiness(session.user.id)
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const gallery = await prisma.galleryImage.findMany({
    where: { businessId: business.id },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ success: true, data: gallery })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await getBusiness(session.user.id)
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const { url, caption } = await req.json()
  if (!url) return NextResponse.json({ success: false, error: 'URL zorunludur' }, { status: 400 })

  const max = await prisma.galleryImage.aggregate({ where: { businessId: business.id }, _max: { sortOrder: true } })
  const item = await prisma.galleryImage.create({
    data: { businessId: business.id, url, caption: caption || null, sortOrder: (max._max.sortOrder ?? 0) + 1 },
  })

  return NextResponse.json({ success: true, data: item })
}
