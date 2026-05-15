import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const role = req.nextUrl.searchParams.get('role')
  const where = role && role !== 'all' ? { role: role as 'CUSTOMER' | 'SALON_OWNER' | 'ADMIN' } : {}

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, name: true, surname: true, email: true, phone: true, role: true,
      isActive: true, createdAt: true,
      _count: { select: { appointments: true, reviews: true } },
      businesses: { select: { id: true, name: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: users })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const { name, surname, email, password, phone, role } = await req.json()

  if (!name || !surname || !email || !password) {
    return NextResponse.json({ success: false, error: 'Zorunlu alanlar eksik' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ success: false, error: 'Bu e-posta zaten kayıtlı' }, { status: 400 })

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, surname, email, phone: phone ?? null, password: hashed, role: role ?? 'CUSTOMER' },
    select: { id: true, name: true, surname: true, email: true, role: true },
  })

  return NextResponse.json({ success: true, data: user })
}
