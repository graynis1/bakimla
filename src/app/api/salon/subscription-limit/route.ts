import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
    include: { subscription: { include: { plan: true } } },
  })

  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const sub = business.subscription
  const rawFeatures = sub?.plan?.features
  const features = (Array.isArray(rawFeatures) || !rawFeatures)
    ? {} as { hasGallery?: boolean; maxGallery?: number | null; canHideReviews?: boolean }
    : rawFeatures as { hasGallery?: boolean; maxGallery?: number | null; canHideReviews?: boolean }

  const [employeeCount, galleryCount] = await Promise.all([
    prisma.employee.count({ where: { businessId: business.id, isActive: true } }),
    prisma.galleryImage.count({ where: { businessId: business.id } }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      status: sub?.status ?? null,
      planName: sub?.plan?.name ?? null,
      maxEmployees: sub?.plan?.maxEmployees ?? null,
      currentEmployeeCount: employeeCount,
      hasGallery: features.hasGallery !== false,
      maxGallery: features.maxGallery ?? null,
      currentGalleryCount: galleryCount,
      canHideReviews: features.canHideReviews !== false,
    },
  })
}
