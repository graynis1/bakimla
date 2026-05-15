import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const loyalty = await prisma.loyaltyPoints.findUnique({
    where: { userId: session.user.id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      points: loyalty?.points ?? 0,
      totalEarned: loyalty?.totalEarned ?? 0,
      totalSpent: loyalty?.totalSpent ?? 0,
      transactions: loyalty?.transactions ?? [],
    },
  })
}
