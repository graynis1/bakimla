import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTimeSlots } from '@/lib/utils'
import { addMinutes, format, parseISO } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const businessId = searchParams.get('businessId')
    const employeeId = searchParams.get('employeeId')
    const serviceId = searchParams.get('serviceId')
    const dateStr = searchParams.get('date')

    if (!businessId || !employeeId || !serviceId || !dateStr) {
      return NextResponse.json({ success: false, error: 'Eksik parametreler' }, { status: 400 })
    }

    const date = parseISO(dateStr)
    const dayOfWeek = date.getDay() // 0=Sun, 1=Mon,...
    const mappedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    const [employee, service, business] = await Promise.all([
      prisma.employee.findFirst({ where: { id: employeeId, businessId, isActive: true }, include: { schedule: true } }),
      prisma.service.findFirst({ where: { id: serviceId, businessId, isActive: true } }),
      prisma.business.findUnique({ where: { id: businessId } }),
    ])

    if (!employee || !service || !business) {
      return NextResponse.json({ success: false, error: 'Kayıt bulunamadı' }, { status: 404 })
    }

    // Check business working hours
    const wh = business.workingHours as Record<string, { open: string; close: string; isOpen: boolean }>
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const dayKey = dayKeys[dayOfWeek]
    const dayHours = wh[dayKey]
    if (!dayHours?.isOpen) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Check employee schedule
    const empSchedule = employee.schedule.find((s) => s.dayOfWeek === mappedDay)
    if (!empSchedule?.isWorking) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Check employee holidays
    const empHoliday = await prisma.employeeHoliday.findFirst({
      where: { employeeId, date: date },
    })
    if (empHoliday) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Check business holidays
    const busHoliday = await prisma.holiday.findFirst({
      where: { businessId, date: date },
    })
    if (busHoliday) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Generate all slots in employee working hours
    const start = empSchedule.startTime > dayHours.open ? empSchedule.startTime : dayHours.open
    const end = empSchedule.endTime < dayHours.close ? empSchedule.endTime : dayHours.close
    const slots = generateTimeSlots(start, end, 15)

    // Get existing appointments for that day
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        employeeId,
        date: date,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })

    // Remove slots that conflict with existing appointments
    const now = new Date()
    const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')

    const availableSlots = slots.filter((slot) => {
      const [sh, sm] = slot.split(':').map(Number)
      const slotStart = sh * 60 + sm
      const slotEnd = slotStart + service.duration

      // Skip past times
      if (isToday) {
        const nowMin = now.getHours() * 60 + now.getMinutes()
        if (slotStart <= nowMin) return false
      }

      // Check end of day
      const [eh, em] = end.split(':').map(Number)
      const endMin = eh * 60 + em
      if (slotEnd > endMin) return false

      // Check conflicts
      for (const appt of existingAppointments) {
        const [as, am] = appt.startTime.split(':').map(Number)
        const [ae, aem] = appt.endTime.split(':').map(Number)
        const apptStart = as * 60 + am
        const apptEnd = ae * 60 + aem
        if (slotStart < apptEnd && slotEnd > apptStart) return false
      }
      return true
    })

    return NextResponse.json({ success: true, data: availableSlots })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Saat hesaplanırken hata oluştu' }, { status: 500 })
  }
}
