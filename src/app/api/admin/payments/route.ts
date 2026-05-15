import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { PaymentStatus } from '@/generated/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status')
  const where = status && status !== 'all' ? { status: status as PaymentStatus } : {}

  const payments = await prisma.payment.findMany({
    where,
    include: {
      business: { select: { id: true, name: true } },
      plan: { select: { id: true, name: true, maxEmployees: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: payments })
}
