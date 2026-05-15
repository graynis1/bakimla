import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function GET() {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configs = await prisma.systemConfig.findMany()
  const map: Record<string, string> = {}
  for (const c of configs) map[c.key] = c.value
  return NextResponse.json(map)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action, ...settings } = body

  if (action === 'test') {
    const { testEmail } = settings
    if (!testEmail) return NextResponse.json({ error: 'Test e-posta adresi gerekli' }, { status: 400 })
    try {
      await sendEmail({
        to: testEmail,
        subject: 'Bakımla SMTP Test E-postası',
        html: '<p>Bu bir test e-postasıdır. SMTP yapılandırmanız başarılı!</p>',
      })
      return NextResponse.json({ success: true, message: 'Test e-postası gönderildi' })
    } catch (err: unknown) {
      return NextResponse.json({ error: 'E-posta gönderilemedi: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
    }
  }

  const updates = Object.entries(settings).map(([key, value]) =>
    prisma.systemConfig.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  )
  await Promise.all(updates)
  return NextResponse.json({ success: true })
}
