import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { addMonths, addYears, format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { sendEmail } from '@/lib/email'
import { paymentApproved, paymentRejected } from '@/lib/email-templates'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 })

  const { id } = await params
  const { status } = await req.json()

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { plan: true },
  })
  if (!payment) return NextResponse.json({ success: false, error: 'Ödeme bulunamadı' }, { status: 404 })

  if (status === 'APPROVED') {
    const now = new Date()
    const endDate = payment.period === 'yearly' ? addYears(now, 1) : addMonths(now, 1)

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id }, data: { status: 'APPROVED' } })

      const existing = await tx.subscription.findFirst({ where: { businessId: payment.businessId } })
      if (existing) {
        await tx.subscription.update({
          where: { id: existing.id },
          data: { planId: payment.planId, status: 'ACTIVE', startDate: now, endDate },
        })
      } else {
        await tx.subscription.create({
          data: { businessId: payment.businessId, planId: payment.planId, status: 'ACTIVE', startDate: now, endDate },
        })
      }

      const business = await tx.business.findUnique({ where: { id: payment.businessId }, select: { ownerId: true, name: true } })
      if (business) {
        await tx.notification.create({
          data: {
            userId: business.ownerId,
            title: 'Ödemeniz Onaylandı',
            message: `${business.name} için ödemeniz onaylandı. Aboneliğiniz aktifleştirildi.`,
            type: 'PAYMENT_APPROVED',
          },
        })

        const owner = await tx.user.findUnique({ where: { id: business.ownerId }, select: { email: true } })
        if (owner) {
          const amount = payment.period === 'yearly'
            ? `${(payment.plan.yearlyPrice?.toNumber() ?? 0).toLocaleString('tr-TR')} ₺/yıl`
            : `${(payment.plan.monthlyPrice?.toNumber() ?? 0).toLocaleString('tr-TR')} ₺/ay`
          sendEmail({
            to: owner.email,
            subject: 'Bakımla – Ödemeniz Onaylandı',
            html: paymentApproved({
              businessName: business.name,
              planName: payment.plan.name,
              amount,
              validUntil: format(endDate, 'd MMMM yyyy', { locale: tr }),
            }),
          }).catch(console.error)
        }
      }
    })
  } else if (status === 'REJECTED') {
    await prisma.payment.update({ where: { id }, data: { status } })

    const business = await prisma.business.findUnique({ where: { id: payment.businessId }, select: { ownerId: true, name: true } })
    if (business) {
      await prisma.notification.create({
        data: {
          userId: business.ownerId,
          title: 'Ödemeniz Reddedildi',
          message: `${business.name} için ödemeniz reddedildi.`,
          type: 'PAYMENT_REJECTED',
        },
      })

      const owner = await prisma.user.findUnique({ where: { id: business.ownerId }, select: { email: true } })
      if (owner) {
        const amount = payment.period === 'yearly'
          ? `${(payment.plan.yearlyPrice?.toNumber() ?? 0).toLocaleString('tr-TR')} ₺/yıl`
          : `${(payment.plan.monthlyPrice?.toNumber() ?? 0).toLocaleString('tr-TR')} ₺/ay`
        sendEmail({
          to: owner.email,
          subject: 'Bakımla – Ödemeniz Reddedildi',
          html: paymentRejected({
            businessName: business.name,
            planName: payment.plan.name,
            amount,
          }),
        }).catch(console.error)
      }
    }
  } else {
    await prisma.payment.update({ where: { id }, data: { status } })
  }

  return NextResponse.json({ success: true })
}
