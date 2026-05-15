import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { parseISO } from 'date-fns'

async function getBusiness(userId: string) {
  return prisma.business.findFirst({ where: { ownerId: userId } })
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await getBusiness(session.user.id)
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const holidays = await prisma.holiday.findMany({
    where: { businessId: business.id },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json({ success: true, data: holidays })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await getBusiness(session.user.id)
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const { date, description } = await req.json()
  if (!date) return NextResponse.json({ success: false, error: 'Tarih zorunludur' }, { status: 400 })

  const holiday = await prisma.holiday.create({
    data: { businessId: business.id, date: parseISO(date), description: description || null },
  })

  return NextResponse.json({ success: true, data: holiday })
}
