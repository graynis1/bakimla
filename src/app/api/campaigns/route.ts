import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const now = new Date()
  const campaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(campaigns)
}
