import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 })

  const { name, surname, email, phone, role, isActive, newPassword } = body
  const data: Record<string, unknown> = {}

  if (name !== undefined) data.name = name
  if (surname !== undefined) data.surname = surname
  if (email !== undefined && email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ success: false, error: 'Bu e-posta zaten kayıtlı' }, { status: 400 })
    data.email = email
  }
  if (phone !== undefined) data.phone = phone
  if (role !== undefined) data.role = role
  if (isActive !== undefined) data.isActive = isActive
  if (newPassword) data.password = await bcrypt.hash(newPassword, 12)

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, surname: true, email: true, role: true, isActive: true },
  })

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params

  if (id === session.user.id) return NextResponse.json({ success: false, error: 'Kendinizi silemezsiniz' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id }, include: { businesses: { select: { id: true } } } })
  if (!user) return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    for (const biz of user.businesses) {
      await tx.review.deleteMany({ where: { businessId: biz.id } })
      await tx.favorite.deleteMany({ where: { businessId: biz.id } })
      await tx.appointment.deleteMany({ where: { businessId: biz.id } })
      await tx.payment.deleteMany({ where: { businessId: biz.id } })
      await tx.business.delete({ where: { id: biz.id } })
    }
    await tx.review.deleteMany({ where: { customerId: id } })
    await tx.appointment.deleteMany({ where: { customerId: id } })
    await tx.favorite.deleteMany({ where: { userId: id } })
    await tx.notification.deleteMany({ where: { userId: id } })
    await tx.passwordResetToken.deleteMany({ where: { userId: id } })
    await tx.pointTransaction.deleteMany({ where: { userId: id } })
    await tx.loyaltyPoints.deleteMany({ where: { userId: id } })
    await tx.user.delete({ where: { id } })
  })

  return NextResponse.json({ success: true })
}
