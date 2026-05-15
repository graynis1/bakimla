import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const accounts = await prisma.bankAccount.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json({ success: true, data: accounts })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const { bankName, accountName, iban, branch } = await req.json()
  const account = await prisma.bankAccount.create({ data: { bankName, accountName, iban, branch } })
  return NextResponse.json({ success: true, data: account })
}
