import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const data = await req.json()

  const account = await prisma.bankAccount.update({
    where: { id },
    data: {
      bankName: data.bankName,
      accountName: data.accountName,
      iban: data.iban,
      branch: data.branch,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
    },
  })

  return NextResponse.json({ success: true, data: account })
}
