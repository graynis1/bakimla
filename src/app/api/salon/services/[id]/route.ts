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

  const service = await prisma.service.findFirst({ where: { id, businessId: business.id } })
  if (!service) return NextResponse.json({ success: false, error: 'Hizmet bulunamadı' }, { status: 404 })

  const data = await req.json()
  const updated = await prisma.service.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      duration: Number(data.duration),
      price: Number(data.price),
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

  const service = await prisma.service.findFirst({ where: { id, businessId: business.id } })
  if (!service) return NextResponse.json({ success: false, error: 'Hizmet bulunamadı' }, { status: 404 })

  await prisma.service.update({ where: { id }, data: { isActive: false } })

  return NextResponse.json({ success: true })
}
