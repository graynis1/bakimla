import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  const business = await prisma.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const review = await prisma.review.findFirst({ where: { id, businessId: business.id } })
  if (!review) return NextResponse.json({ success: false, error: 'Yorum bulunamadı' }, { status: 404 })

  const { isVisible } = await req.json()
  const updated = await prisma.review.update({ where: { id }, data: { isVisible } })

  return NextResponse.json({ success: true, data: updated })
}
