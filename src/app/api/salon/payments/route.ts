import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await prisma.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const payments = await prisma.payment.findMany({
    where: { businessId: business.id, status: 'PENDING' },
    include: { plan: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: payments })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await prisma.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const { planId, period, receiptUrl } = await req.json()

  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  if (!plan) return NextResponse.json({ success: false, error: 'Plan bulunamadı' }, { status: 404 })

  const amount = period === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice

  const payment = await prisma.payment.create({
    data: {
      businessId: business.id,
      planId,
      amount,
      period,
      receiptUrl,
      status: 'PENDING',
    },
  })

  return NextResponse.json({ success: true, data: payment })
}
