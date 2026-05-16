import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isSubscriptionActive } from '@/lib/subscription'
import { addMinutes, format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { sendEmail } from '@/lib/email'
import { appointmentConfirmedCustomer, newAppointmentSalon } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor' }, { status: 401 })

    const body = await req.json()
    const { businessId, employeeId, serviceId, date: dateStr, startTime, notes } = body

    if (!businessId || !employeeId || !serviceId || !dateStr || !startTime) {
      return NextResponse.json({ success: false, error: 'Eksik parametreler' }, { status: 400 })
    }

    const date = parseISO(dateStr)

    const [business, employee, service] = await Promise.all([
      prisma.business.findUnique({ where: { id: businessId }, include: { subscription: { include: { plan: true } } } }),
      prisma.employee.findFirst({ where: { id: employeeId, businessId, isActive: true } }),
      prisma.service.findFirst({ where: { id: serviceId, businessId, isActive: true } }),
    ])

    if (!business || business.status !== 'APPROVED') {
      return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })
    }
    if (!employee || !service) {
      return NextResponse.json({ success: false, error: 'Çalışan veya hizmet bulunamadı' }, { status: 404 })
    }
    if (!business.subscription || !isSubscriptionActive(business.subscription)) {
      return NextResponse.json({ success: false, error: 'İşletme şu anda randevu kabul etmiyor' }, { status: 400 })
    }

    const [sh, sm] = startTime.split(':').map(Number)
    const startMinutes = sh * 60 + sm
    const endMinutes = startMinutes + service.duration
    const endHour = Math.floor(endMinutes / 60)
    const endMin = endMinutes % 60
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`

    // Check for conflicts
    const conflict = await prisma.appointment.findFirst({
      where: {
        employeeId,
        date,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
      },
    })

    if (conflict) {
      return NextResponse.json({ success: false, error: 'Bu saat dilimi dolu' }, { status: 409 })
    }

    // Create appointment + points in transaction
    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          customerId: session.user.id,
          businessId,
          employeeId,
          serviceId,
          date,
          startTime,
          endTime,
          price: service.price,
          notes: notes || null,
          status: 'PENDING',
        },
      })

      await tx.notification.create({
        data: {
          userId: session.user.id,
          title: 'Randevunuz Alındı',
          message: `${business.name} için ${format(date, 'dd.MM.yyyy')} tarihinde saat ${startTime} randevunuz oluşturuldu.`,
          type: 'APPOINTMENT_CONFIRMED',
          relatedId: appointment.id,
        },
      })

      // Award points (1 point per 10 TL)
      const points = Math.floor(service.price.toNumber() / 10)
      if (points > 0) {
        const existing = await tx.loyaltyPoints.findUnique({ where: { userId: session.user.id } })
        if (existing) {
          await tx.loyaltyPoints.update({
            where: { userId: session.user.id },
            data: { points: { increment: points }, totalEarned: { increment: points } },
          })
        } else {
          await tx.loyaltyPoints.create({
            data: { userId: session.user.id, points, totalEarned: points },
          })
        }
        await tx.pointTransaction.create({
          data: {
            userId: session.user.id,
            points,
            type: 'EARNED',
            description: `${service.name} - ${business.name}`,
            appointmentId: appointment.id,
          },
        })
      }

      return appointment
    })

    // Notify salon owner in-app
    const customer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, surname: true, email: true, phone: true } })
    const businessOwner = await prisma.user.findUnique({ where: { id: business.ownerId }, select: { email: true } })

    await prisma.notification.create({
      data: {
        userId: business.ownerId,
        title: 'Yeni Randevu Talebi',
        message: `${customer ? `${customer.name} ${customer.surname}` : 'Bir müşteri'} ${format(date, 'dd.MM.yyyy')} tarihinde ${startTime} için ${service.name} randevusu oluşturdu.`,
        type: 'APPOINTMENT_CONFIRMED',
        relatedId: result.id,
      },
    })

    // Notify admins in-app
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          title: 'Yeni Randevu',
          message: `${business.name} işletmesine yeni randevu talebi geldi.`,
          type: 'APPOINTMENT_CONFIRMED' as const,
          relatedId: result.id,
        })),
      })
    }
    const dateLabel = format(date, 'd MMMM yyyy EEEE', { locale: tr })

    if (customer) {
      sendEmail({
        to: customer.email,
        subject: `Bakımla – Randevunuz Alındı: ${business.name}`,
        html: appointmentConfirmedCustomer({
          customerName: `${customer.name} ${customer.surname}`,
          businessName: business.name,
          serviceName: service.name,
          employeeName: `${employee.name} ${employee.surname}`,
          date: dateLabel,
          time: startTime,
        }),
      }).catch(console.error)
    }

    if (businessOwner) {
      sendEmail({
        to: businessOwner.email,
        subject: `Bakımla – Yeni Randevu Talebi`,
        html: newAppointmentSalon({
          businessName: business.name,
          customerName: customer ? `${customer.name} ${customer.surname}` : 'Müşteri',
          customerPhone: customer?.phone ?? undefined,
          serviceName: service.name,
          employeeName: `${employee.name} ${employee.surname}`,
          date: dateLabel,
          time: startTime,
        }),
      }).catch(console.error)
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Randevu oluşturulurken hata oluştu' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor' }, { status: 401 })

    const appointments = await prisma.appointment.findMany({
      where: { customerId: session.user.id },
      include: {
        business: { select: { id: true, name: true, slug: true, coverImage: true, address: true, city: true, district: true, phone: true } },
        employee: { select: { id: true, name: true, surname: true, title: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    })

    return NextResponse.json({ success: true, data: appointments })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}
