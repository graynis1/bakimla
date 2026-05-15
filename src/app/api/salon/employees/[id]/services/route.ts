import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function getEmployee(userId: string, empId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } })
  if (!business) return { employee: null, business: null }
  const employee = await prisma.employee.findFirst({ where: { id: empId, businessId: business.id } })
  return { employee, business }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  const { id } = await params
  const { employee, business } = await getEmployee(session.user.id, id)
  if (!employee || !business) return NextResponse.json({ success: false, error: 'Bulunamadı' }, { status: 404 })

  const [assignedServices, allServices] = await Promise.all([
    prisma.employeeService.findMany({ where: { employeeId: id }, include: { service: true } }),
    prisma.service.findMany({ where: { businessId: business.id, isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ])

  return NextResponse.json({
    success: true,
    data: { assigned: assignedServices.map((s) => s.serviceId), services: allServices },
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  const { id } = await params
  const { employee, business } = await getEmployee(session.user.id, id)
  if (!employee || !business) return NextResponse.json({ success: false, error: 'Bulunamadı' }, { status: 404 })

  const serviceIds: string[] = await req.json()

  // Verify all services belong to this business
  const validServices = await prisma.service.findMany({
    where: { id: { in: serviceIds }, businessId: business.id },
    select: { id: true },
  })
  const validIds = validServices.map((s) => s.id)

  await prisma.$transaction([
    prisma.employeeService.deleteMany({ where: { employeeId: id } }),
    prisma.employeeService.createMany({
      data: validIds.map((serviceId) => ({ employeeId: id, serviceId })),
    }),
  ])

  return NextResponse.json({ success: true })
}
