import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Geçici debug endpoint — sorunu bulduktan sonra sil
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  try {
    const { email, password } = await req.json()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ step: 'user_not_found', email })
    const valid = await bcrypt.compare(password, user.password)
    return NextResponse.json({
      step: valid ? 'ok' : 'wrong_password',
      isActive: user.isActive,
      role: user.role,
    })
  } catch (err) {
    return NextResponse.json({ step: 'db_error', error: String(err) })
  }
}
