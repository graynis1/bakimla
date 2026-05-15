import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { appointmentReminder } from '@/lib/email-templates'
import { format, addHours } from 'date-fns'
import { tr } from 'date-fns/locale'

// Called by external cron (e.g. cron-job.org) every hour via:
// GET /api/cron/reminders  with header  x-cron-secret: <CRON_SECRET>
// Sends reminder emails for CONFIRMED appointments in the next 23-25 hour window
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const windowStart = addHours(now, 23)
  const windowEnd = addHours(now, 25)

  const appointments = await prisma.appointment.findMany({
    where: {
      status: 'CONFIRMED',
      date: { gte: windowStart, lte: windowEnd },
    },
    include: {
      customer: { select: { email: true, name: true, surname: true } },
      business: { select: { name: true, address: true, city: true, district: true } },
      service: { select: { name: true } },
    },
  })

  let sent = 0
  for (const appt of appointments) {
    try {
      await sendEmail({
        to: appt.customer.email,
        subject: `Bakımla – Yarın Randevunuz Var: ${appt.business.name}`,
        html: appointmentReminder({
          customerName: `${appt.customer.name} ${appt.customer.surname}`,
          businessName: appt.business.name,
          serviceName: appt.service.name,
          date: format(new Date(appt.date), 'd MMMM yyyy EEEE', { locale: tr }),
          time: appt.startTime,
          address: `${appt.business.address}, ${appt.business.district}/${appt.business.city}`,
        }),
      })
      sent++
    } catch (err) {
      console.error(`Reminder failed for appointment ${appt.id}:`, err)
    }
  }

  return NextResponse.json({ success: true, sent, total: appointments.length })
}
