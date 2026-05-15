import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor' }, { status: 401 })

    const { businessId, appointmentId, rating, comment } = await req.json()

    if (!businessId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Geçersiz veriler' }, { status: 400 })
    }

    // Check if already reviewed this appointment
    if (appointmentId) {
      const existing = await prisma.review.findFirst({ where: { appointmentId, customerId: session.user.id } })
      if (existing) return NextResponse.json({ success: false, error: 'Bu randevu için zaten yorum yapıldı' }, { status: 409 })
    }

    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          customerId: session.user.id,
          businessId,
          appointmentId: appointmentId || null,
          rating,
          comment: comment || null,
          isVisible: true,
        },
      })

      // Update business rating
      const stats = await tx.review.aggregate({
        where: { businessId, isVisible: true },
        _avg: { rating: true },
        _count: { rating: true },
      })

      await tx.business.update({
        where: { id: businessId },
        data: {
          rating: stats._avg.rating ?? 0,
          reviewCount: stats._count.rating,
        },
      })

      return r
    })

    return NextResponse.json({ success: true, data: review })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Yorum eklenirken hata oluştu' }, { status: 500 })
  }
}
