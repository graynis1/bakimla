import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { slugify } from '@/lib/utils'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const business = await prisma.business.findUnique({ where: { id } })
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const { name, category, city, district, phone, address, description, coverImage, status, ownerId } = body
  const updateData: Record<string, unknown> = {}

  if (status !== undefined) updateData.status = status
  if (name !== undefined) {
    updateData.name = name
    const newSlug = slugify(name)
    const exists = await prisma.business.findFirst({ where: { slug: newSlug, NOT: { id } } })
    updateData.slug = exists ? `${newSlug}-${Date.now()}` : newSlug
  }
  if (category !== undefined) updateData.category = category
  if (city !== undefined) updateData.city = city
  if (district !== undefined) updateData.district = district
  if (phone !== undefined) updateData.phone = phone
  if (address !== undefined) updateData.address = address
  if (description !== undefined) updateData.description = description
  if (coverImage !== undefined) updateData.coverImage = coverImage
  if (ownerId !== undefined) updateData.ownerId = ownerId

  const updated = await prisma.business.update({ where: { id }, data: updateData })

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const business = await prisma.business.findUnique({ where: { id } })
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.review.deleteMany({ where: { businessId: id } })
    await tx.favorite.deleteMany({ where: { businessId: id } })
    await tx.appointment.deleteMany({ where: { businessId: id } })
    await tx.payment.deleteMany({ where: { businessId: id } })
    await tx.business.delete({ where: { id } })
  })

  return NextResponse.json({ success: true })
}
