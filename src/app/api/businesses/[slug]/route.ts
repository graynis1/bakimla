import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        employees: {
          where: { isActive: true },
          include: {
            services: { include: { service: true } },
            schedule: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        services: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        gallery: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          where: { isVisible: true },
          include: { customer: { select: { name: true, surname: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        subscription: { include: { plan: true } },
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })
    }

    const rawFeatures = business.subscription?.plan?.features
    const features = (Array.isArray(rawFeatures) || !rawFeatures)
      ? {} as { hasGallery?: boolean }
      : rawFeatures as { hasGallery?: boolean }

    const data = { ...business, gallery: features.hasGallery !== false ? business.gallery : [] }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}
