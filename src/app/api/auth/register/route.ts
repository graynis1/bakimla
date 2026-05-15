import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { addDays } from 'date-fns'
import { sendEmail } from '@/lib/email'
import { welcomeEmail } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, surname, email, phone, password, role, businessName, category, city, district, businessPhone } = body

    if (!name || !surname || !email || !password) {
      return NextResponse.json({ success: false, error: 'Zorunlu alanlar eksik' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Bu e-posta adresi zaten kayıtlı' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)

    if (role === 'SALON_OWNER') {
      const defaultPlan = await prisma.plan.findFirst({ where: { isActive: true }, orderBy: { monthlyPrice: 'asc' } })

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { name, surname, email, phone, password: hashed, role: 'SALON_OWNER' },
        })

        let slug = slugify(businessName || name)
        const existing = await tx.business.findUnique({ where: { slug } })
        if (existing) slug = `${slug}-${Date.now()}`

        const business = await tx.business.create({
          data: {
            ownerId: user.id,
            name: businessName || name,
            slug,
            category: category || 'HAIR_SALON',
            phone: businessPhone || phone || '',
            address: '',
            city: city || '',
            district: district || '',
            status: 'PENDING',
            workingHours: {
              mon: { open: '09:00', close: '19:00', isOpen: true },
              tue: { open: '09:00', close: '19:00', isOpen: true },
              wed: { open: '09:00', close: '19:00', isOpen: true },
              thu: { open: '09:00', close: '19:00', isOpen: true },
              fri: { open: '09:00', close: '19:00', isOpen: true },
              sat: { open: '10:00', close: '17:00', isOpen: true },
              sun: { open: '10:00', close: '17:00', isOpen: false },
            },
          },
        })

        if (defaultPlan) {
          await tx.subscription.create({
            data: {
              businessId: business.id,
              planId: defaultPlan.id,
              status: 'TRIAL',
              startDate: new Date(),
              trialEndsAt: addDays(new Date(), 14),
            },
          })
        }

        await tx.notification.create({
          data: {
            userId: user.id,
            title: 'Bakımla\'ya Hoş Geldiniz!',
            message: 'İşletmeniz incelemeye alındı. Onaylandıktan sonra randevu kabul edebilirsiniz.',
            type: 'WELCOME',
          },
        })

        return user
      })

      sendEmail({
        to: email,
        subject: 'Bakımla\'ya Hoş Geldiniz!',
        html: welcomeEmail({ name, role: 'SALON_OWNER' }),
      }).catch(console.error)

      return NextResponse.json({ success: true, data: { id: result.id } })
    } else {
      const user = await prisma.user.create({
        data: { name, surname, email, phone, password: hashed, role: 'CUSTOMER' },
      })

      sendEmail({
        to: email,
        subject: 'Bakımla\'ya Hoş Geldiniz!',
        html: welcomeEmail({ name, role: 'CUSTOMER' }),
      }).catch(console.error)

      return NextResponse.json({ success: true, data: { id: user.id } })
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Kayıt sırasında bir hata oluştu' }, { status: 500 })
  }
}
