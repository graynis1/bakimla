import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encode } from '@auth/core/jwt'

const COOKIE_NAME = process.env.NODE_ENV === 'production'
  ? '__Secure-authjs.session-token'
  : 'authjs.session-token'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Eksik bilgi' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.isActive) {
      return NextResponse.json({ ok: false, error: 'Kullanıcı bulunamadı' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password ?? '')
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'Şifre hatalı' }, { status: 401 })
    }

    const token = await encode({
      token: {
        sub: user.id,
        userId: user.id,
        email: user.email,
        name: `${user.name} ${user.surname}`,
        role: user.role,
      },
      secret: process.env.NEXTAUTH_SECRET!,
      salt: COOKIE_NAME,
      maxAge: 30 * 24 * 60 * 60,
    })

    const res = NextResponse.json({ ok: true, role: user.role })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    })

    return res
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ ok: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}
