import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { passwordResetEmail } from '@/lib/email-templates'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'E-posta gerekli' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  // Always return success to prevent email enumeration
  if (!user) return NextResponse.json({ success: true })

  // Invalidate existing tokens
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${token}`
  await sendEmail({
    to: email,
    subject: 'Bakımla – Şifre Sıfırlama',
    html: passwordResetEmail({ name: user.name, resetUrl }),
  })

  return NextResponse.json({ success: true })
}
