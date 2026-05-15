import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  const business = await prisma.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const holiday = await prisma.holiday.findFirst({ where: { id, businessId: business.id } })
  if (!holiday) return NextResponse.json({ success: false, error: 'Tatil bulunamadı' }, { status: 404 })

  await prisma.holiday.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
