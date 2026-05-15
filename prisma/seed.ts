import { PrismaClient } from '../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { addMonths } from 'date-fns'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' })
const prisma = new PrismaClient({ adapter })

const WH = {
  mon: { isOpen: true, open: '09:00', close: '19:00' },
  tue: { isOpen: true, open: '09:00', close: '19:00' },
  wed: { isOpen: true, open: '09:00', close: '19:00' },
  thu: { isOpen: true, open: '09:00', close: '19:00' },
  fri: { isOpen: true, open: '09:00', close: '19:00' },
  sat: { isOpen: true, open: '10:00', close: '17:00' },
  sun: { isOpen: false, open: '10:00', close: '17:00' },
}

async function main() {
  console.log('🌱 Seeding...')

  // Plans
  const planBasic = await prisma.plan.upsert({
    where: { name: 'Başlangıç' },
    update: {},
    create: {
      name: 'Başlangıç',
      maxEmployees: 2,
      monthlyPrice: 299,
      yearlyPrice: 2990,
      features: ['Online randevu', 'Müşteri bildirimleri', 'Temel istatistikler'],
    },
  })

  const planPro = await prisma.plan.upsert({
    where: { name: 'Profesyonel' },
    update: {},
    create: {
      name: 'Profesyonel',
      maxEmployees: 5,
      monthlyPrice: 599,
      yearlyPrice: 5990,
      features: ['Online randevu', 'SMS bildirimleri', 'Gelişmiş istatistikler', 'Galeri', 'Öncelikli destek'],
    },
  })

  const planPremium = await prisma.plan.upsert({
    where: { name: 'Premium' },
    update: {},
    create: {
      name: 'Premium',
      maxEmployees: 15,
      monthlyPrice: 999,
      yearlyPrice: 9990,
      features: ['Sınırsız randevu', 'SMS & E-posta bildirimler', 'Tam istatistik paketi', 'Galeri', 'Özel profil', '7/24 destek'],
    },
  })

  console.log('✅ Plans')

  // Bank accounts
  await prisma.bankAccount.upsert({
    where: { iban: 'TR12 0006 2000 1234 0006 2997 51' },
    update: {},
    create: {
      bankName: 'Ziraat Bankası',
      accountName: 'Bakımla Teknoloji A.Ş.',
      iban: 'TR12 0006 2000 1234 0006 2997 51',
      branch: 'Kadıköy Şubesi',
    },
  })

  await prisma.bankAccount.upsert({
    where: { iban: 'TR33 0006 1005 1978 6457 8413 26' },
    update: {},
    create: {
      bankName: 'Türkiye İş Bankası',
      accountName: 'Bakımla Teknoloji A.Ş.',
      iban: 'TR33 0006 1005 1978 6457 8413 26',
      branch: 'Beşiktaş Şubesi',
    },
  })

  console.log('✅ Bank accounts')

  // Admin
  const adminPw = await bcrypt.hash('Admin123!', 12)
  await prisma.user.upsert({
    where: { email: 'admin@bakimla.com' },
    update: { password: adminPw },
    create: { email: 'admin@bakimla.com', password: adminPw, name: 'Super', surname: 'Admin', role: 'ADMIN', isActive: true },
  })

  // Customers
  const custPw = await bcrypt.hash('musteri123', 12)
  const customers = await Promise.all([
    prisma.user.upsert({ where: { email: 'ayse@example.com' }, update: {}, create: { email: 'ayse@example.com', password: custPw, name: 'Ayşe', surname: 'Kaya', phone: '05321234567' } }),
    prisma.user.upsert({ where: { email: 'fatma@example.com' }, update: {}, create: { email: 'fatma@example.com', password: custPw, name: 'Fatma', surname: 'Demir', phone: '05329876543' } }),
    prisma.user.upsert({ where: { email: 'mehmet@example.com' }, update: {}, create: { email: 'mehmet@example.com', password: custPw, name: 'Mehmet', surname: 'Yılmaz', phone: '05334567890' } }),
    prisma.user.upsert({ where: { email: 'zeynep@example.com' }, update: {}, create: { email: 'zeynep@example.com', password: custPw, name: 'Zeynep', surname: 'Şahin', phone: '05341234567' } }),
    prisma.user.upsert({ where: { email: 'ali@example.com' }, update: {}, create: { email: 'ali@example.com', password: custPw, name: 'Ali', surname: 'Çelik', phone: '05359876543' } }),
  ])

  // Salon owners
  const salonPw = await bcrypt.hash('salon123', 12)
  const owners = await Promise.all([
    prisma.user.upsert({ where: { email: 'salon1@example.com' }, update: {}, create: { email: 'salon1@example.com', password: salonPw, name: 'Kemal', surname: 'Arslan', role: 'SALON_OWNER' } }),
    prisma.user.upsert({ where: { email: 'salon2@example.com' }, update: {}, create: { email: 'salon2@example.com', password: salonPw, name: 'Selin', surname: 'Kurt', role: 'SALON_OWNER' } }),
    prisma.user.upsert({ where: { email: 'salon3@example.com' }, update: {}, create: { email: 'salon3@example.com', password: salonPw, name: 'Baran', surname: 'Öztürk', role: 'SALON_OWNER' } }),
    prisma.user.upsert({ where: { email: 'salon4@example.com' }, update: {}, create: { email: 'salon4@example.com', password: salonPw, name: 'Neslihan', surname: 'Aydın', role: 'SALON_OWNER' } }),
    prisma.user.upsert({ where: { email: 'salon5@example.com' }, update: {}, create: { email: 'salon5@example.com', password: salonPw, name: 'Tarık', surname: 'Güneş', role: 'SALON_OWNER' } }),
  ])

  console.log('✅ Users')

  // Businesses
  const now = new Date()
  const endDate = addMonths(now, 1)
  const trialEnd = addMonths(now, 0.5)

  const bData = [
    { slug: 'kemal-erkek-kuaforu-kadikoy', name: 'Kemal Erkek Kuaförü', category: 'BARBER' as const, ownerId: owners[0].id, city: 'İstanbul', district: 'Kadıköy', address: 'Moda Caddesi No:42', phone: '02163456789', description: '20 yıllık deneyimle profesyonel erkek kuaför hizmetleri.', rating: 4.8, reviewCount: 124, coverImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800', status: 'APPROVED' as const, planId: planPro.id, subStatus: 'ACTIVE' as const },
    { slug: 'selin-guzellik-merkezi-besiktas', name: 'Selin Güzellik Merkezi', category: 'BEAUTY_CENTER' as const, ownerId: owners[1].id, city: 'İstanbul', district: 'Beşiktaş', address: 'Barbaros Bulvarı No:78', phone: '02122345678', description: 'Cilt bakımı, makyaj ve lash lifting konusunda uzman ekibimiz.', rating: 4.9, reviewCount: 89, coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800', status: 'APPROVED' as const, planId: planPremium.id, subStatus: 'ACTIVE' as const },
    { slug: 'harmony-spa-sisli', name: 'Harmony Spa & Wellness', category: 'SPA' as const, ownerId: owners[2].id, city: 'İstanbul', district: 'Şişli', address: 'Halaskargazi Caddesi No:156', phone: '02123456789', description: 'Masaj, aromaterapi ve hamam tedavileri.', rating: 4.7, reviewCount: 67, coverImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800', status: 'APPROVED' as const, planId: planPro.id, subStatus: 'ACTIVE' as const },
    { slug: 'neslihan-nail-studio-uskudar', name: 'Neslihan Nail Art Studio', category: 'NAIL_SALON' as const, ownerId: owners[3].id, city: 'İstanbul', district: 'Üsküdar', address: 'Bağlarbaşı Sokak No:12', phone: '02163987654', description: 'Kalıcı oje, nail art ve protez tırnak uygulamaları.', rating: 4.6, reviewCount: 43, coverImage: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800', status: 'APPROVED' as const, planId: planBasic.id, subStatus: 'ACTIVE' as const },
    { slug: 'tarik-barber-mecidiyekoy', name: 'Tarık Barber & Grooming', category: 'BARBER' as const, ownerId: owners[4].id, city: 'İstanbul', district: 'Mecidiyeköy', address: 'Büyükdere Caddesi No:89', phone: '02122987654', description: 'Modern erkek bakımı; saç kesimi ve sakal şekillendirme.', rating: 4.5, reviewCount: 31, coverImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', status: 'APPROVED' as const, planId: planBasic.id, subStatus: 'TRIAL' as const },
  ]

  const businesses: any[] = []
  for (const { planId, subStatus, ...rest } of bData) {
    const biz = await prisma.business.upsert({
      where: { slug: rest.slug },
      update: {},
      create: { ...rest, workingHours: WH, metaTitle: `${rest.name} | Bakımla` },
    })

    await prisma.subscription.upsert({
      where: { businessId: biz.id },
      update: {},
      create: {
        businessId: biz.id, planId, status: subStatus, startDate: now,
        endDate: subStatus === 'ACTIVE' ? endDate : null,
        trialEndsAt: subStatus === 'TRIAL' ? trialEnd : null,
      },
    })
    businesses.push(biz)
  }

  console.log('✅ Businesses')

  // Employees
  const defSchedule = (empId: string) =>
    Array.from({ length: 7 }, (_, i) => ({
      employeeId: empId, dayOfWeek: i, isWorking: i !== 6,
      startTime: '09:00', endTime: i === 5 ? '17:00' : '19:00',
    }))

  const e1 = await prisma.employee.upsert({ where: { id: 'emp-k1' }, update: {}, create: { id: 'emp-k1', businessId: businesses[0].id, name: 'Kemal', surname: 'Arslan', title: 'Baş Kuaför', bio: '15 yıl deneyim', sortOrder: 1 } })
  const e2 = await prisma.employee.upsert({ where: { id: 'emp-k2' }, update: {}, create: { id: 'emp-k2', businessId: businesses[0].id, name: 'Hüseyin', surname: 'Yıldız', title: 'Kuaför', sortOrder: 2 } })
  const e3 = await prisma.employee.upsert({ where: { id: 'emp-s1' }, update: {}, create: { id: 'emp-s1', businessId: businesses[1].id, name: 'Selin', surname: 'Kurt', title: 'Cilt Bakım Uzmanı', sortOrder: 1 } })
  const e4 = await prisma.employee.upsert({ where: { id: 'emp-s2' }, update: {}, create: { id: 'emp-s2', businessId: businesses[1].id, name: 'Merve', surname: 'Acar', title: 'Lash & Brow Uzmanı', sortOrder: 2 } })
  const e5 = await prisma.employee.upsert({ where: { id: 'emp-sp1' }, update: {}, create: { id: 'emp-sp1', businessId: businesses[2].id, name: 'Baran', surname: 'Öztürk', title: 'Masaj Terapisti', sortOrder: 1 } })
  const e6 = await prisma.employee.upsert({ where: { id: 'emp-n1' }, update: {}, create: { id: 'emp-n1', businessId: businesses[3].id, name: 'Neslihan', surname: 'Aydın', title: 'Nail Artist', sortOrder: 1 } })
  const e7 = await prisma.employee.upsert({ where: { id: 'emp-t1' }, update: {}, create: { id: 'emp-t1', businessId: businesses[4].id, name: 'Tarık', surname: 'Güneş', title: 'Berber', sortOrder: 1 } })

  for (const emp of [e1, e2, e3, e4, e5, e6, e7]) {
    await prisma.employeeSchedule.deleteMany({ where: { employeeId: emp.id } })
    await prisma.employeeSchedule.createMany({ data: defSchedule(emp.id) })
  }

  console.log('✅ Employees')

  // Services
  const s1 = await prisma.service.upsert({ where: { id: 'svc-1' }, update: {}, create: { id: 'svc-1', businessId: businesses[0].id, name: 'Saç Kesimi', duration: 30, price: 150, sortOrder: 1 } })
  const s2 = await prisma.service.upsert({ where: { id: 'svc-2' }, update: {}, create: { id: 'svc-2', businessId: businesses[0].id, name: 'Sakal Tıraşı', duration: 20, price: 100, sortOrder: 2 } })
  const s3 = await prisma.service.upsert({ where: { id: 'svc-3' }, update: {}, create: { id: 'svc-3', businessId: businesses[0].id, name: 'Saç + Sakal Kombo', duration: 45, price: 220, sortOrder: 3 } })
  const s4 = await prisma.service.upsert({ where: { id: 'svc-4' }, update: {}, create: { id: 'svc-4', businessId: businesses[1].id, name: 'Cilt Bakımı', duration: 60, price: 350, description: 'Derin temizlik ve nemlendirme', sortOrder: 1 } })
  const s5 = await prisma.service.upsert({ where: { id: 'svc-5' }, update: {}, create: { id: 'svc-5', businessId: businesses[1].id, name: 'Kalıcı Oje', duration: 45, price: 200, sortOrder: 2 } })
  const s6 = await prisma.service.upsert({ where: { id: 'svc-6' }, update: {}, create: { id: 'svc-6', businessId: businesses[1].id, name: 'Lash Lifting', duration: 75, price: 450, sortOrder: 3 } })
  const s7 = await prisma.service.upsert({ where: { id: 'svc-7' }, update: {}, create: { id: 'svc-7', businessId: businesses[2].id, name: 'Klasik Masaj (60 dk)', duration: 60, price: 400, sortOrder: 1 } })
  const s8 = await prisma.service.upsert({ where: { id: 'svc-8' }, update: {}, create: { id: 'svc-8', businessId: businesses[2].id, name: 'Aromaterapi Masajı (90 dk)', duration: 90, price: 600, sortOrder: 2 } })
  const s9 = await prisma.service.upsert({ where: { id: 'svc-9' }, update: {}, create: { id: 'svc-9', businessId: businesses[3].id, name: 'Kalıcı Oje (El)', duration: 45, price: 180, sortOrder: 1 } })
  const s10 = await prisma.service.upsert({ where: { id: 'svc-10' }, update: {}, create: { id: 'svc-10', businessId: businesses[3].id, name: 'Jel Tırnak', duration: 90, price: 350, sortOrder: 2 } })
  const s11 = await prisma.service.upsert({ where: { id: 'svc-11' }, update: {}, create: { id: 'svc-11', businessId: businesses[4].id, name: 'Saç Kesimi', duration: 30, price: 130, sortOrder: 1 } })

  // Employee-Service links
  const links = [
    { employeeId: e1.id, serviceId: s1.id }, { employeeId: e1.id, serviceId: s2.id }, { employeeId: e1.id, serviceId: s3.id },
    { employeeId: e2.id, serviceId: s1.id }, { employeeId: e2.id, serviceId: s2.id }, { employeeId: e2.id, serviceId: s3.id },
    { employeeId: e3.id, serviceId: s4.id }, { employeeId: e3.id, serviceId: s5.id }, { employeeId: e3.id, serviceId: s6.id },
    { employeeId: e4.id, serviceId: s5.id }, { employeeId: e4.id, serviceId: s6.id },
    { employeeId: e5.id, serviceId: s7.id }, { employeeId: e5.id, serviceId: s8.id },
    { employeeId: e6.id, serviceId: s9.id }, { employeeId: e6.id, serviceId: s10.id },
    { employeeId: e7.id, serviceId: s11.id },
  ]
  for (const l of links) {
    await prisma.employeeService.upsert({ where: { employeeId_serviceId: l }, update: {}, create: l })
  }

  console.log('✅ Services & links')

  // Appointments
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  const lastWeek = new Date(now); lastWeek.setDate(lastWeek.getDate() - 7)
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)

  const appts = [
    { id: 'appt-1', customerId: customers[0].id, businessId: businesses[0].id, employeeId: e1.id, serviceId: s1.id, date: yesterday, startTime: '10:00', endTime: '10:30', price: 150, status: 'COMPLETED' as const },
    { id: 'appt-2', customerId: customers[0].id, businessId: businesses[1].id, employeeId: e3.id, serviceId: s4.id, date: lastWeek, startTime: '14:00', endTime: '15:00', price: 350, status: 'COMPLETED' as const },
    { id: 'appt-3', customerId: customers[1].id, businessId: businesses[1].id, employeeId: e3.id, serviceId: s5.id, date: yesterday, startTime: '11:00', endTime: '11:45', price: 200, status: 'COMPLETED' as const },
    { id: 'appt-4', customerId: customers[2].id, businessId: businesses[0].id, employeeId: e2.id, serviceId: s3.id, date: tomorrow, startTime: '09:00', endTime: '09:45', price: 220, status: 'CONFIRMED' as const },
    { id: 'appt-5', customerId: customers[3].id, businessId: businesses[2].id, employeeId: e5.id, serviceId: s7.id, date: tomorrow, startTime: '13:00', endTime: '14:00', price: 400, status: 'PENDING' as const },
    { id: 'appt-6', customerId: customers[4].id, businessId: businesses[1].id, employeeId: e4.id, serviceId: s6.id, date: yesterday, startTime: '15:00', endTime: '16:15', price: 450, status: 'COMPLETED' as const },
  ]

  for (const appt of appts) {
    await prisma.appointment.upsert({ where: { id: appt.id }, update: {}, create: appt as any })
  }

  console.log('✅ Appointments')

  // Reviews
  const revs = [
    { id: 'rev-1', customerId: customers[0].id, businessId: businesses[0].id, appointmentId: 'appt-1', rating: 5, comment: 'Harika deneyim! Kemal Bey çok profesyonel.' },
    { id: 'rev-2', customerId: customers[0].id, businessId: businesses[1].id, appointmentId: 'appt-2', rating: 5, comment: 'Cildim çok iyi hissettirdi. Teşekkürler!' },
    { id: 'rev-3', customerId: customers[1].id, businessId: businesses[1].id, appointmentId: 'appt-3', rating: 4, comment: 'Güzel kalıcı oje uygulaması. Randevuya tam uyuldu.' },
    { id: 'rev-4', customerId: customers[4].id, businessId: businesses[1].id, appointmentId: 'appt-6', rating: 5, comment: 'Lash lifting muhteşem oldu!' },
  ]

  for (const r of revs) {
    await prisma.review.upsert({ where: { id: r.id }, update: {}, create: { ...r, isVisible: true } as any })
  }

  // Update ratings
  for (const biz of businesses) {
    const stats = await prisma.review.aggregate({ where: { businessId: biz.id, isVisible: true }, _avg: { rating: true }, _count: { rating: true } })
    if (stats._count.rating > 0) {
      await prisma.business.update({ where: { id: biz.id }, data: { rating: stats._avg.rating ?? 0, reviewCount: stats._count.rating } })
    }
  }

  console.log('✅ Reviews')

  // Loyalty points
  const lp = await prisma.loyaltyPoints.upsert({ where: { userId: customers[0].id }, update: {}, create: { userId: customers[0].id, points: 50, totalEarned: 50 } })
  await prisma.pointTransaction.createMany({
    skipDuplicates: true,
    data: [
      { userId: customers[0].id, loyaltyId: lp.id, points: 15, type: 'EARNED', description: 'Saç Kesimi - Kemal Erkek Kuaförü', appointmentId: 'appt-1' },
      { userId: customers[0].id, loyaltyId: lp.id, points: 35, type: 'EARNED', description: 'Cilt Bakımı - Selin Güzellik Merkezi', appointmentId: 'appt-2' },
    ],
  })

  console.log('✅ Loyalty points')

  // Gallery
  const gallery = [
    { id: 'gal-1', businessId: businesses[0].id, url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600', caption: 'Saç kesimi çalışmamız', sortOrder: 1 },
    { id: 'gal-2', businessId: businesses[0].id, url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600', caption: 'Sakal tıraşı', sortOrder: 2 },
    { id: 'gal-3', businessId: businesses[1].id, url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600', caption: 'Cilt bakım odamız', sortOrder: 1 },
    { id: 'gal-4', businessId: businesses[2].id, url: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=600', caption: 'Masaj odamız', sortOrder: 1 },
  ]

  for (const img of gallery) {
    await prisma.galleryImage.upsert({ where: { id: img.id }, update: {}, create: img })
  }

  console.log('✅ Gallery')

  console.log('\n🎉 Seed tamamlandı!')
  console.log('  Admin:    admin@bakimla.com / Admin123!')
  console.log('  Müşteri:  ayse@example.com / musteri123')
  console.log('  Salon:    salon1@example.com / salon123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
