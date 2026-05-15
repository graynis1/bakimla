import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Bağlantı geçersiz veya süresi dolmuş' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
  ])

  return NextResponse.json({ success: true })
}
