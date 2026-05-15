import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function getEmployee(userId: string, empId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } })
  if (!business) return null
  return prisma.employee.findFirst({ where: { id: empId, businessId: business.id }, include: { schedule: true } })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  const { id } = await params
  const employee = await getEmployee(session.user.id, id)
  if (!employee) return NextResponse.json({ success: false, error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json({ success: true, data: employee.schedule })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  const { id } = await params
  const employee = await getEmployee(session.user.id, id)
  if (!employee) return NextResponse.json({ success: false, error: 'Bulunamadı' }, { status: 404 })

  // schedule: array of { dayOfWeek: 0-6, isWorking: bool, startTime: "09:00", endTime: "19:00" }
  const schedule: { dayOfWeek: number; isWorking: boolean; startTime: string; endTime: string }[] = await req.json()

  await prisma.$transaction(
    schedule.map((s) =>
      prisma.employeeSchedule.upsert({
        where: { employeeId_dayOfWeek: { employeeId: id, dayOfWeek: s.dayOfWeek } },
        update: { isWorking: s.isWorking, startTime: s.startTime, endTime: s.endTime },
        create: { employeeId: id, dayOfWeek: s.dayOfWeek, isWorking: s.isWorking, startTime: s.startTime, endTime: s.endTime },
      })
    )
  )

  return NextResponse.json({ success: true })
}
