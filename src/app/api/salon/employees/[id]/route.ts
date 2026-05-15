import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function getBusiness(userId: string) {
  return prisma.business.findFirst({ where: { ownerId: userId } })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  const business = await getBusiness(session.user.id)
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const employee = await prisma.employee.findFirst({ where: { id, businessId: business.id } })
  if (!employee) return NextResponse.json({ success: false, error: 'Çalışan bulunamadı' }, { status: 404 })

  const data = await req.json()
  const updated = await prisma.employee.update({
    where: { id },
    data: {
      name: data.name,
      surname: data.surname,
      title: data.title || null,
      bio: data.bio || null,
      phone: data.phone || null,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
    },
  })

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  const business = await getBusiness(session.user.id)
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const employee = await prisma.employee.findFirst({ where: { id, businessId: business.id } })
  if (!employee) return NextResponse.json({ success: false, error: 'Çalışan bulunamadı' }, { status: 404 })

  await prisma.employee.update({ where: { id }, data: { isActive: false } })

  return NextResponse.json({ success: true })
}
