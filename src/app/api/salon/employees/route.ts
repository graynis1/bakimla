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

  const employees = await prisma.employee.findMany({
    where: { businessId: business.id },
    include: { services: { include: { service: true } }, schedule: true },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ success: true, data: employees })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await getBusiness(session.user.id)
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const { name, surname, title, bio, phone } = await req.json()
  if (!name || !surname) return NextResponse.json({ success: false, error: 'Ad ve soyad zorunludur' }, { status: 400 })

  const count = await prisma.employee.count({ where: { businessId: business.id, isActive: true } })

  // Check subscription limit
  const sub = await prisma.subscription.findFirst({
    where: { businessId: business.id },
    include: { plan: true },
  })
  if (sub?.plan?.maxEmployees && count >= sub.plan.maxEmployees) {
    return NextResponse.json({ success: false, error: 'Çalışan limitine ulaştınız' }, { status: 400 })
  }

  const employee = await prisma.$transaction(async (tx) => {
    const maxOrder = await tx.employee.aggregate({ where: { businessId: business.id }, _max: { sortOrder: true } })
    const emp = await tx.employee.create({
      data: { businessId: business.id, name, surname, title, bio, phone, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
    })
    // Default schedule (Mon-Fri 09-19, Sat 09-17, Sun off)
    const schedules = Array.from({ length: 7 }, (_, i) => ({
      employeeId: emp.id,
      dayOfWeek: i,
      isWorking: i < 6,
      startTime: '09:00',
      endTime: i === 5 ? '17:00' : '19:00',
    }))
    await tx.employeeSchedule.createMany({ data: schedules })
    return emp
  })

  return NextResponse.json({ success: true, data: employee })
}
