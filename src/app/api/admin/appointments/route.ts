import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { AppointmentStatus } from '@/generated/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const businessId = searchParams.get('businessId')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20

  const where: Record<string, unknown> = {}
  if (status) where.status = status as AppointmentStatus
  if (businessId) where.businessId = businessId

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        business: { select: { id: true, name: true, slug: true } },
        customer: { select: { name: true, surname: true, email: true } },
        employee: { select: { name: true, surname: true } },
        service: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appointment.count({ where }),
  ])

  return NextResponse.json({ success: true, data: appointments, total, page, totalPages: Math.ceil(total / limit) })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })
  }

  const { id, status } = await req.json()
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: status as AppointmentStatus },
  })

  return NextResponse.json({ success: true, data: appointment })
}
