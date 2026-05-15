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

  const services = await prisma.service.findMany({
    where: { businessId: business.id },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ success: true, data: services })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await getBusiness(session.user.id)
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const { name, description, duration, price } = await req.json()
  if (!name || !duration || price == null) return NextResponse.json({ success: false, error: 'Eksik alanlar' }, { status: 400 })

  const max = await prisma.service.aggregate({ where: { businessId: business.id }, _max: { sortOrder: true } })
  const service = await prisma.service.create({
    data: { businessId: business.id, name, description: description || null, duration: Number(duration), price: Number(price), sortOrder: (max._max.sortOrder ?? 0) + 1 },
  })

  return NextResponse.json({ success: true, data: service })
}
