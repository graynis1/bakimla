import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const plans = await prisma.plan.findMany({ orderBy: { maxEmployees: 'asc' } })
  return NextResponse.json({ success: true, data: plans })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const { name, maxEmployees, monthlyPrice, yearlyPrice, features } = await req.json()
  const plan = await prisma.plan.create({
    data: { name, maxEmployees, monthlyPrice, yearlyPrice, features: features || [] },
  })

  return NextResponse.json({ success: true, data: plan })
}
