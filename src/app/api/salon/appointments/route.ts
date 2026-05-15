import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { parseISO, startOfDay, endOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await prisma.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const dateStr = req.nextUrl.searchParams.get('date')
  const fromStr = req.nextUrl.searchParams.get('from')
  const toStr = req.nextUrl.searchParams.get('to')
  const status = req.nextUrl.searchParams.get('status')

  const where: Record<string, unknown> = { businessId: business.id }
  if (fromStr && toStr) {
    where.date = { gte: startOfDay(parseISO(fromStr)), lte: endOfDay(parseISO(toStr)) }
  } else if (dateStr) {
    const d = parseISO(dateStr)
    where.date = { gte: startOfDay(d), lte: endOfDay(d) }
  }
  if (status && status !== 'all') where.status = status

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      customer: { select: { name: true, surname: true, phone: true } },
      service: { select: { name: true, duration: true } },
      employee: { select: { id: true, name: true, surname: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  return NextResponse.json({ success: true, data: appointments })
}
