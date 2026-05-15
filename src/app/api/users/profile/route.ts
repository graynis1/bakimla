import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, surname: true, email: true, phone: true },
  })

  return NextResponse.json({ success: true, data: user })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const { name, surname, phone } = await req.json()

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, surname, phone },
    select: { name: true, surname: true, email: true, phone: true },
  })

  return NextResponse.json({ success: true, data: updated })
}
