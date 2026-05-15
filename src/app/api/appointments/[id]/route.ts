import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { sendEmail } from '@/lib/email'
import { appointmentConfirmedCustomer, appointmentCancelledCustomer } from '@/lib/email-templates'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor' }, { status: 401 })

    const { id } = await params
    const { status } = await req.json()

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        business: { select: { name: true, ownerId: true } },
        service: { select: { name: true } },
        employee: { select: { name: true, surname: true } },
        customer: { select: { email: true, name: true, surname: true } },
      },
    })

    if (!appointment) return NextResponse.json({ success: false, error: 'Randevu bulunamadı' }, { status: 404 })

    const isSalonOwner = session.user.role === 'SALON_OWNER' && appointment.business.ownerId === session.user.id
    const isCustomer = session.user.role === 'CUSTOMER' && appointment.customerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isSalonOwner && !isCustomer && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 403 })
    }

    if (isCustomer && status !== 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Müşteriler yalnızca iptal edebilir' }, { status: 403 })
    }

    const updated = await prisma.appointment.update({ where: { id }, data: { status } })

    const dateLabel = format(new Date(appointment.date), 'd MMMM yyyy', { locale: tr })

    if (status === 'CANCELLED') {
      await prisma.notification.create({
        data: {
          userId: appointment.customerId,
          title: 'Randevu İptal Edildi',
          message: `${appointment.business.name} için randevunuz iptal edildi.`,
          type: 'APPOINTMENT_CANCELLED',
          relatedId: appointment.id,
        },
      })
      sendEmail({
        to: appointment.customer.email,
        subject: `Bakımla – Randevunuz İptal Edildi`,
        html: appointmentCancelledCustomer({
          customerName: `${appointment.customer.name} ${appointment.customer.surname}`,
          businessName: appointment.business.name,
          serviceName: appointment.service.name,
          date: dateLabel,
          time: appointment.startTime,
        }),
      }).catch(console.error)
    }

    if (status === 'CONFIRMED') {
      await prisma.notification.create({
        data: {
          userId: appointment.customerId,
          title: 'Randevunuz Onaylandı',
          message: `${appointment.business.name} için randevunuz onaylandı.`,
          type: 'APPOINTMENT_CONFIRMED',
          relatedId: appointment.id,
        },
      })
      sendEmail({
        to: appointment.customer.email,
        subject: `Bakımla – Randevunuz Onaylandı`,
        html: appointmentConfirmedCustomer({
          customerName: `${appointment.customer.name} ${appointment.customer.surname}`,
          businessName: appointment.business.name,
          serviceName: appointment.service.name,
          employeeName: `${appointment.employee.name} ${appointment.employee.surname}`,
          date: dateLabel,
          time: appointment.startTime,
        }),
      }).catch(console.error)
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}
