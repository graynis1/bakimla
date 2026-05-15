import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
  })

  return NextResponse.json({ success: true, data: business })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const data = await req.json()
  const { name, category, description, phone, address, city, district, coverImage, workingHours, metaTitle, metaDescription, whatsapp, instagram, businessEmail } = data

  const business = await prisma.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: { name, category, description, phone, address, city, district, coverImage, workingHours, metaTitle, metaDescription, whatsapp, instagram, businessEmail },
  })

  return NextResponse.json({ success: true, data: updated })
}
