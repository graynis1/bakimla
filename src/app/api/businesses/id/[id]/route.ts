import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        employees: {
          where: { isActive: true },
          include: { services: { include: { service: true } }, schedule: true },
          orderBy: { sortOrder: 'asc' },
        },
        services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        subscription: { include: { plan: true } },
      },
    })

    if (!business || business.status !== 'APPROVED') {
      return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: business })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}
