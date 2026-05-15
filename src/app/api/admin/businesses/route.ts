import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { slugify } from '@/lib/utils'
import { addDays } from 'date-fns'
import type { BusinessStatus } from '@/generated/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status')
  const where = status && status !== 'all' ? { status: status as BusinessStatus } : {}

  const businesses = await prisma.business.findMany({
    where,
    include: { owner: { select: { id: true, name: true, surname: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: businesses })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const body = await req.json()
  const { name, category, city, district, phone, address, description, coverImage, ownerId, status } = body

  if (!name || !category || !city || !district || !phone || !ownerId) {
    return NextResponse.json({ success: false, error: 'Zorunlu alanlar eksik' }, { status: 400 })
  }

  let slug = slugify(name)
  const exists = await prisma.business.findUnique({ where: { slug } })
  if (exists) slug = `${slug}-${Date.now()}`

  const defaultPlan = await prisma.plan.findFirst({ where: { isActive: true }, orderBy: { monthlyPrice: 'asc' } })

  const business = await prisma.$transaction(async (tx) => {
    const biz = await tx.business.create({
      data: {
        ownerId,
        name,
        slug,
        category,
        phone,
        address: address ?? '',
        city,
        district,
        description: description ?? null,
        coverImage: coverImage ?? null,
        status: status ?? 'PENDING',
        workingHours: {
          mon: { isOpen: true, open: '09:00', close: '19:00' },
          tue: { isOpen: true, open: '09:00', close: '19:00' },
          wed: { isOpen: true, open: '09:00', close: '19:00' },
          thu: { isOpen: true, open: '09:00', close: '19:00' },
          fri: { isOpen: true, open: '09:00', close: '19:00' },
          sat: { isOpen: true, open: '10:00', close: '17:00' },
          sun: { isOpen: false, open: '10:00', close: '17:00' },
        },
      },
    })
    if (defaultPlan) {
      await tx.subscription.create({
        data: { businessId: biz.id, planId: defaultPlan.id, status: 'TRIAL', startDate: new Date(), trialEndsAt: addDays(new Date(), 14) },
      })
    }
    return biz
  })

  return NextResponse.json({ success: true, data: business })
}
