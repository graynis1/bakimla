import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
    include: { subscription: { include: { plan: true } } },
  })

  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  return NextResponse.json({ success: true, data: business.subscription })
}
