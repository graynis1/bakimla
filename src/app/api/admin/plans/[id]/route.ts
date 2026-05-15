import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const data = await req.json()

  const plan = await prisma.plan.update({
    where: { id },
    data: {
      name: data.name,
      maxEmployees: data.maxEmployees,
      monthlyPrice: data.monthlyPrice,
      yearlyPrice: data.yearlyPrice,
      features: data.features,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
    },
  })

  return NextResponse.json({ success: true, data: plan })
}
